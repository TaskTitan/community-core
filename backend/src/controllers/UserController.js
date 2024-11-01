import UserModel from '../models/UserModel.js';

class UserController {
  healthCheck(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.status(200).json({ status: 'OK' });
  }
  async getUserStats(req, res) {
    try {
      const stats = await UserModel.getUserStats(req.user.userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Error fetching user statistics' });
    }
  }
}

export default new UserController();
