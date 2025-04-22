import React, {useState, useEffect} from 'react';

function LoginForm({username, password, loading, handleLogin, setUsername, setPassword}) {
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
        </form>
    )
}

function EditorForm({title, post, handleSubmit, handleLogout, setTitle, setPost, loading, blogs, handleEditPost, handleCancelEdit, editingPostId}) {
    const isEditing = editingPostId !== null;
    return (
        <>
            <h2>Editor</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="title">Title:</label>
                <input type="text" name="title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <br />
                <label htmlFor="post">Post:</label>
                <textarea name="post" id="post" value={post} onChange={(e) => setPost(e.target.value)}></textarea>
                <br />
                <button type="submit" disabled={loading}>{loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Post' : 'Create Post')}</button>                
                {isEditing && (
                    <button type="button" onClick={handleCancelEdit} disabled={loading} style={{ marginLeft: '10px' }}>
                        Cancel Edit
                    </button>
                )}
            </form>

            <ul>
                {blogs.map((blog) => (
                    <div key={blog.id}>
                        <h3>{blog.title}</h3>
                        <p>{blog.post}</p>
                        <button onClick={() => handleEditPost(blog)}>Edit Post</button>
                    </div>
                ))}
            </ul>
            <button onClick={handleLogout} style={{ marginTop: '10px' }} disabled={loading}>Logout</button>
        </>
    )
}

function Editor() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState(null);
    const [title, setTitle] = useState('');
    const [post, setPost] = useState('');
    const [blogs, setBlogs] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);

    useEffect(() => {
            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
              // Set the token in the state
              setToken(storedToken);
            }
          }, []);

    useEffect(() => {
        if (token)
            fetchMyBlogs();
        else {
            setBlogs([])
        }
    }, [token])

    const fetchMyBlogs = async () => {
        const currentToken = localStorage.getItem('authToken');
        if (!currentToken) {
            setError('You must be logged in to fetch blogs');
            handleLogout()
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3000/api/blogs/mine', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
            });

            if (response.status === 401) {
                console.warn('Received 401 Unauthorized. Token likely expired or invalid.');
                handleLogout();
                setError('Your session has expired. Please log in again.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const fetchedBlogs = await response.json();
            setBlogs(fetchedBlogs);
        }  catch (error) {
            console.error('Error fetching blogs:', error);
            setError(error.message || 'Error fetching blogs');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentToken = localStorage.getItem('authToken');
        if (!currentToken) {
            setError('You must be logged in to edit blogs');
            handleLogout()
            return;
        }

        setLoading(true)
        setError('');

        const isEditing = editingPostId !== null;
        const url = isEditing
        ? `http://localhost:3000/api/blogs/${editingPostId}` 
        : 'http://localhost:3000/api/createPost';     
        const method = isEditing ? 'PUT' : 'POST'

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    title: title,
                    post: post
                }),
            })

            if (response.status === 401) {
                console.warn('Received 401 Unauthorized. Token likely expired or invalid.');
                handleLogout();
                setError('Your session has expired. Please log in again.');
                setLoading(false);
                return;
            }

            const errorData = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            setTitle('');
            setPost('');
            setEditingPostId(null);
            setError('');

            fetchMyBlogs()

        } catch(err) {
            console.error('Error creating post:', err);
            setError(err.message || 'Error creating post');
        } finally {
            setLoading(false)
        }
    }

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

    const handleLogout =  () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setError('');
    }

    const handleEditPost = (blogToEdit) => {
        setTitle(blogToEdit.title);
        setPost(blogToEdit.post);
        setEditingPostId(blogToEdit.id);
        setError('');
    }

    const handleCancelEdit = () => {
        setTitle('');
        setPost('');
        setEditingPostId(null); // Go back to 'create' mode
        setError('');
    };

    return (
        <div>
            {!token ? (<LoginForm
                    username={username}
                    password={password}
                    loading={loading}
                    handleLogin={handleLogin}
                    setUsername={setUsername}
                    setPassword={setPassword}
                />) : (<EditorForm
                    title={title}
                    post={post}
                    loading={loading}
                    handleSubmit={handleSubmit}
                    handleLogout={handleLogout}
                    setTitle={setTitle}
                    setPost={setPost}
                    blogs={blogs}
                    handleEditPost={handleEditPost}
                    handleCancelEdit={handleCancelEdit}
                    editingPostId={editingPostId}
                />)}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        </div>
    )
}

export default Editor;