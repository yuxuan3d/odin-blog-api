import React, { useState, useEffect } from 'react';

function AuthComponent() {
    const [blogs, setBlogs] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log("Component mounted, fetching blogs...");
        fetchAllBlogs();
    }, []);
   
    const handlePosts =  () => {
        window.open('http://localhost:5000', '_blank');
    }

    const BlogsList = () => {
        if (loading) return <p>Loading blogs...</p>;
        if (!loading && blogs.length === 0 && !error) return <p>No blogs found.</p>;
        if (error) return null;

        return (
            <div>
                <button onClick={handlePosts} disabled={loading}>Edit Posts</button>
                <ul>
                    {blogs.map((blog) => (
                        <div key={blog.id}>
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
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3000/api/blogs', {
                method: 'GET',
            });

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
    

  return (
    <div>
      <h1>BlogMate</h1>
      {BlogsList()}
      {error && <p style={{ color: 'red' }}>Error:{error}</p>}
    </div>
  );
}

export default AuthComponent;