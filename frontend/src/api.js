const BASE_URL = 'http://127.0.0.1:5000';

export const GITHUB_LOGIN_URL = `${BASE_URL}/api/auth/github`;

function getToken() {
  return localStorage.getItem('blog_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('blog_token', token);
  } else {
    localStorage.removeItem('blog_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('blog_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('blog_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('blog_user');
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || '请求失败');
  }

  return data;
}

// ===== Auth =====
export const authApi = {
  register: (username, password, nickname) =>
    request('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname }),
    }),
  login: (username, password) =>
    request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// ===== User =====
export const userApi = {
  getMe: () => request('/api/users/me'),
  updateProfile: (data) =>
    request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ===== Blog =====
export const blogApi = {
  list: (page = 1, limit = 20, sort = 'latest') => request(`/api/blogs?page=${page}&limit=${limit}&sort=${sort}`),
  getById: (id) => request(`/api/blogs/${id}`),
  create: (data) =>
    request('/api/blogs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/api/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    request(`/api/blogs/${id}`, { method: 'DELETE' }),
  myBlogs: () => request('/api/blogs/my/all'),
};

// ===== Comment =====
export const commentApi = {
  list: (blogId) => request(`/api/blogs/${blogId}/comments`),
  create: (blogId, content, parentId) =>
    request(`/api/blogs/${blogId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId || null }),
    }),
  remove: (id) =>
    request(`/api/comments/${id}`, { method: 'DELETE' }),
};

// ===== Like =====
export const likeApi = {
  toggle: (blogId) =>
    request(`/api/blogs/${blogId}/like`, { method: 'POST' }),
  status: (blogId) => request(`/api/blogs/${blogId}/like-status`),
};

export default { authApi, userApi, blogApi, commentApi, likeApi };
