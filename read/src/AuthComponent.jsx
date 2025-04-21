import React, { useState, useEffect } from 'react';

function AuthComponent() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState(null);
    const [blogs, setBlogs] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Set the token in the state when it's stored in localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          // Set the token in the state
          setToken(storedToken);
        }
      }, []);

    // Fetch blogs when the token changes
    useEffect(() => {
        if (token) {
            fetchAllBlogs();
        } else {
            setBlogs([]);
        }
    }, [token]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            if (data.token) {
                console.log('token:', data.token);
                localStorage.setItem('authToken', data.token);
                setToken(data.token);
                setUsername('');
                setPassword('');
            } else {
                throw new Error('No token returned from server');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            setError(error.message || 'Login failed. Check credentials');
            setToken(null);
            localStorage.removeItem('authToken');
        } finally {
            setLoading(false);
        }
    } 

    const LoginForm = () => {
    return (
        <form onSubmit={handleLogin}>
            <h2>Login</h2>
            <label htmlFor="username">Username:</label>
            <input type="text" name="username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <br />
            <label htmlFor="password">Password:</label>
            <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <br />
            <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    )
    }

    const BlogsList = () => {
        return (
            <div>
                {loading && <p>Loading blogs...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display errors */}
                <ul>
                    {blogs.map((blog) => (
                        <div>
                            <h3>{blog.title}</h3>
                            <p>{blog.post}</p>
                            <p>Author: {blog.author.username}</p>
                            <small>Created: {new Date(blog.createdAt).toLocaleString()}</small>
                        </div>
                    ))}
                </ul>
            </div>
        )
    }

    const fetchAllBlogs = async () => {
        const currentToken = localStorage.getItem('authToken');
        if (!currentToken) {
            setError('You must be logged in to fetch blogs');
            setError(null);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3000/api/blogs', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const fetchedBlogs = await response.json();
            console.log('fetched blogs:', fetchedBlogs);
            setBlogs(fetchedBlogs);
        }  catch (error) {
            console.error('Error fetching blogs:', error);
            setError(error.message || 'Error fetching blogs');
        } finally {
            setLoading(false);
        }
    }
    

  return (
    <div>
      <h1>BlogMate</h1>
      {!token ? LoginForm() : BlogsList()}
      {error && <p style={{ color: 'red' }}>Error:{error}</p>}
    </div>
  );
}

export default AuthComponent;