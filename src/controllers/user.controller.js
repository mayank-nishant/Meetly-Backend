import httpstatus from 'http-status';
import { User } from '../models/user.model.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Meeting } from '../models/meeting.model.js';

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(httpstatus.BAD_REQUEST)
      .json({ message: 'Please provide username and password' });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(httpstatus.NOT_FOUND)
        .json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(httpstatus.UNAUTHORIZED)
        .json({ message: 'Invalid password' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.token = token;
    await user.save();

    return res.status(httpstatus.OK).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res
      .status(httpstatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal Server Error' });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res
        .status(httpstatus.CONFLICT)
        .json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, username, password: hashedPassword });
    await newUser.save();

    return res
      .status(httpstatus.CREATED)
      .json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register Error:', error);

    return res
      .status(httpstatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal Server Error', error: error.message });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    if (!token) {
      return res
        .status(httpstatus.BAD_REQUEST)
        .json({ message: 'Missing token' });
    }

    const user = await User.findOne({ token });
    if (!user) {
      return res
        .status(httpstatus.NOT_FOUND)
        .json({ message: 'User not found' });
    }

    const meetings = await Meeting.find({ user_id: user._id }).sort({
      createdAt: -1,
    });

    return res.status(httpstatus.OK).json({ meetings });
  } catch (error) {
    console.error('getUserHistory error:', error);
    return res
      .status(httpstatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal Server Error' });
  }
};

const addToHistory = async (req, res) => {
  // Accept token and meeting code from either body (POST) or query (for flexibility)
  const { token, meeting_code, meetingCode } = { ...req.body, ...req.query };

  try {
    if (!token || !(meeting_code || meetingCode)) {
      return res
        .status(httpstatus.BAD_REQUEST)
        .json({ message: 'Missing token or meeting code' });
    }

    const user = await User.findOne({ token });
    if (!user) {
      return res
        .status(httpstatus.NOT_FOUND)
        .json({ message: 'User not found' });
    }

    const code = meeting_code || meetingCode;

    const newMeeting = new Meeting({
      user_id: user._id,
      meetingCode: code,
      date: new Date(),
    });

    await newMeeting.save();

    return res
      .status(httpstatus.CREATED)
      .json({ message: 'Meeting saved', meeting: newMeeting });
  } catch (error) {
    console.error('addToHistory error:', error);
    return res
      .status(httpstatus.INTERNAL_SERVER_ERROR)
      .json({ message: 'Internal Server Error' });
  }
};

export { login, register, getUserHistory, addToHistory };
