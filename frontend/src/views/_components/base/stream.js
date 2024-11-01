import store from '@/store/state';
import { updateContentArea } from './response';
import { API_CONFIG } from '../../../tt.config.js'

export async function handleGenerateClick(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const responseArea = document.getElementById('response-area');
  const placeholder = document.getElementById('placeholder-text');
  if (placeholder) {
    placeholder.remove();
  }

  const generateButton = document.querySelector('.generate');
  const defaultInnerHTML = generateButton.innerHTML;

  if (!store.state.chat.isStreaming) {
    const templateForm = document.getElementById('template-form');
    const templateData = _extractTemplateData(templateForm);

    try {
      store.commit('chat/SET_STREAMING', true);
      generateButton.innerHTML = `<img src="./src/img/icons/create-light.svg" alt="" />Cancel`;
      generateButton.classList.add('cancel');
      document.getElementById('content-actions').style.display = 'none';

      let finalResponse = await _sendTemplateDataToServer(templateData);
      let finalCleanedResponse = await removeStreamId(finalResponse);

      store.commit('chat/ADD_MESSAGE', {
        role: 'assistant',
        content: finalCleanedResponse,
      });

      store.commit('chat/SET_ACTIVE_STREAM', null);
      document.getElementById('content-actions').style.display = 'flex';
    } catch (error) {
      console.error('Error in generating text:', error);
    }
  } else {
    if (store.state.chat.activeStreamId) {
      await _sendCancelStreamRequest();
      store.commit('chat/SET_STREAMING', false);
      generateButton.innerHTML = defaultInnerHTML;
      generateButton.classList.remove('cancel');
      document.getElementById('content-actions').style.display = 'flex';
    }
  }

  store.commit('chat/SET_STREAMING', false);
  generateButton.innerHTML = defaultInnerHTML;
  generateButton.classList.remove('cancel');
  document.getElementById('content-actions').style.display = 'flex';
}
export function removeStreamId(str) {
  if (typeof str !== 'string') {
    console.warn('removeStreamId received non-string input:', str);
    return '';
  }
  const regex = /\{ streamId: .+ \}\n\n/;
  let content = str.replace(regex, '');
  return content;
}

function _extractTemplateData(templateForm) {
  const formData = new FormData(templateForm);
  const formDataObject = {};

  if (store.state.chat.page === 'chat') {
    formDataObject['is-chatbot-mode-enabled'] = true;
  }

  formData.forEach(function (value, key) {
    formDataObject[key] = value;
  });

  const providerSelect = document.querySelector('#model-selector .select-wrapper:nth-child(1) .custom-select .selected');
  const modelSelect = document.querySelector('#model-selector .select-wrapper:nth-child(2) .custom-select .selected');

  if (providerSelect) {
    formDataObject['provider'] = providerSelect.textContent.trim();
  }

  if (modelSelect) {
    formDataObject['model'] = modelSelect.textContent.trim();
  }

  return formDataObject;
}
async function _sendTemplateDataToServer(templateData) {
  const responseArea = document.getElementById('response-area');
  const formData = _buildFormData(templateData);
  let streamController = new AbortController();

  try {
    const authToken = localStorage.getItem('token');
    const endpoint = store.state.chat.page === 'chat' 
      ? `${API_CONFIG.BASE_URL}/api/stream/start-chat-stream`
      : `${API_CONFIG.BASE_URL}/api/stream/start-tool-forge-stream`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: streamController.signal,
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${authToken}`,
      },
    });

    let finalResponse = await _processStream(response, templateData);
    return finalResponse;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream canceled by the user');
    } else {
      console.error('Error:', error);
      responseArea.textContent = 'Error: ' + error.message;
    }
  } finally {
    streamController = null;
  }
}
function _buildFormData(templateData) {
  let formData = new FormData();
  const { provider, model, ...queryData } = templateData;
  let queryDataString = JSON.stringify(queryData);

  formData.append('query', queryDataString);

  if (provider) {
    formData.append('provider', provider);
  }
  if (model) {
    formData.append('model', model);
  }

  if (store.state.chat.page === 'chat') {
    formData.append('isChat', true);
    formData.append('messages', JSON.stringify(store.state.chat.messages));
  }

  document.querySelectorAll('input[type="file"]').forEach((fileInput) => {
    const files = fileInput.files;
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
  });

  return formData;
}
async function _processStream(response, templateData) {
  const responseArea = document.getElementById('response-area');

  if (response.ok && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let markdownContent = '';
    store.state.messageCount++;

    const newReceivedMessage = _appendMessages(templateData);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const textChunk = decoder.decode(value, { stream: true });
      if (!store.state.chat.activeStreamId) {
        store.state.chat.activeStreamId = _extractStreamId(textChunk);
        newReceivedMessage.id = `message-${store.state.chat.activeStreamId}`;
      }
      markdownContent += textChunk;
      updateContentArea(markdownContent, newReceivedMessage);
    }

    document.querySelector('#response-area').setAttribute('data-output-id', store.state.chat.activeStreamId);
    return markdownContent;
  } else {
    responseArea.textContent = 'Stream not supported by the browser or the server responded with an error.';
  }
}
function _appendMessages(templateData) {
  const responseArea = document.getElementById('response-area');
  const currentChat = responseArea.innerHTML.trim();

  let newSentMessage = document.createElement('div');
  newSentMessage.classList.add('user-message-sent');
  newSentMessage.setAttribute('message-number', store.state.messageCount);
  newSentMessage.contentEditable = 'true';
  newSentMessage.innerHTML = templateData['user-current-message'];
  store.state.chat.messages.push({
    role: 'user',
    content: templateData['user-current-message'],
  });

  let newReceivedMessage = document.createElement('div');
  newReceivedMessage.classList.add('assistant-message-receive');
  newReceivedMessage.setAttribute('message-number', store.state.messageCount);
  newReceivedMessage.contentEditable = 'true';

  if (store.state.chat.page === 'chat') {
    responseArea.innerHTML = '';
    responseArea.insertAdjacentHTML('afterbegin', currentChat);
    responseArea.appendChild(newSentMessage);
    responseArea.appendChild(newReceivedMessage);
    responseArea.scrollTop = responseArea.scrollHeight;
  } else {
    responseArea.innerHTML = '';
    responseArea.appendChild(newReceivedMessage);
  }

  return newReceivedMessage;
}
async function _sendCancelStreamRequest() {
  let data = {
    streamId: store.state.chat.activeStreamId,
  };
  try {
    const authToken = localStorage.getItem('token');
    const endpoint = store.state.chat.page === 'chat'
      ? `${API_CONFIG.BASE_URL}/api/stream/cancel-chat-stream`
      : `${API_CONFIG.BASE_URL}/api/stream/cancel-tool-forge-stream`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`Stream with ID ${store.state.chat.activeStreamId} has been cancelled.`);
  } catch (e) {
    console.error('Error sending cancel request:', e);
  }
}
function _extractStreamId(dataString) {
  const streamIdPattern = /\{ streamId: (\S+) \}/;
  const match = dataString.match(streamIdPattern);

  if (match && match.length > 1) {
    return match[1];
  } else {
    return null;
  }
}