import { API_CONFIG } from '@/tt.config.js';
import generateUUID from "@/views/_utils/generateUUID.js";

const getAuthHeaders = () => {
  const authToken = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
};

export async function fetchTools(baseUrl = API_CONFIG.BASE_URL) {
  const response = await fetch(`${baseUrl}/api/custom-tools`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    console.log('Error in fetchTools:', response.status, response.statusText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.tools;
}

export async function saveTool(tool, baseUrl = API_CONFIG.BASE_URL) {
  const url = tool.id 
    ? `${baseUrl}/api/custom-tools/${tool.id}` 
    : `${baseUrl}/api/custom-tools/save`;

  const method = tool.id ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method: method,
    headers: getAuthHeaders(),
    body: JSON.stringify({ tool: { ...tool, isShareable: tool.isShareable || false } }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const savedTool = await response.json();

  if (!savedTool.id && !savedTool.toolId) {
    console.error("Server returned a tool without an ID:", savedTool);
    savedTool.id = tool.id || generateUUID();
  } else if (savedTool.toolId && !savedTool.id) {
    savedTool.id = savedTool.toolId;
  }

  return savedTool;
}

export async function deleteTool(toolId, baseUrl = API_CONFIG.BASE_URL) {
  const response = await fetch(`${baseUrl}/api/custom-tools/${toolId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

export async function getTool(toolId, baseUrl = API_CONFIG.BASE_URL) {
  const response = await fetch(`${baseUrl}/api/custom-tools/${toolId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function importTool(toolId) {
  return await getTool(toolId, API_CONFIG.REMOTE_URL);
}

export async function shareTool(tool) {
  return await saveTool(tool, API_CONFIG.REMOTE_URL);
}