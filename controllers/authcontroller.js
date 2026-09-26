import User from '../models/User.js';
import bcrypt from 'bcrypt';

// Show login page (without layout)
export function showLogin(req, res) {
  res.render('login', {
    layout: false,
    title: 'Login',
    error: null
  });
}

// Show register page (without layout)
export function showRegister(req, res) {
  res.render('register', {
    layout: false,
    title: 'Register',
    error: null
  });
}

// Handle user registration
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Basic input validation
    if (!name || !email || !password) {
      return res.render('register', {
        layout: false,
        title: 'Register',
        error: 'Name, email, and password are required.',
        name,
        email
      });
    }

    if (password.length < 8) {
      return res.render('register', {
        layout: false,
        title: 'Register',
        error: 'Password must be at least 8 characters.',
        name,
        email
      });
    }

    // Email already exists?
    const existing = await User.findOne({ email });
    if (existing) {
      return res.render('register', {
        layout: false,
        title: 'Register',
        error: 'Email already exists.',
        name,
        email
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Save user info in session
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || null
    };

    res.redirect('/home');

  } catch (err) {
    console.error('❌ Registration error:', err);
    res.render('register', {
      layout: false,
      title: 'Register',
      error: 'Error registering user. Please try again.',
      name: req.body.name,
      email: req.body.email
    });
  }
}

// Handle login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('login', {
        layout: false,
        title: 'Login',
        error: 'Email and password are required.',
        email
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', {
        layout: false,
        title: 'Login',
        error: 'Invalid email or password.',
        email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        layout: false,
        title: 'Login',
        error: 'Invalid email or password.',
        email
      });
    }

    // Save user info in session
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || null
    };

    res.redirect('/home');

  } catch (err) {
    console.error('❌ Login error:', err);
    res.render('login', {
      layout: false,
      title: 'Login',
      error: 'Error logging in. Please try again.',
      email: req.body.email
    });
  }
}

// Handle logout
export function logout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error('❌ Logout error:', err);
    }
    res.redirect('/login');
  });
}