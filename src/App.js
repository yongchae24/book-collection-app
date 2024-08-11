import React, { useState, useEffect } from 'react';
import './styles.css';  // Import your styles here
import SignUp from './SignUp';
import SignIn from './SignIn';
import VerifyAccount from './VerifyAccount';
import UserPool from './cognitoConfig';
import axios from 'axios';

const API_URL = 'https://gp04cp7bte.execute-api.us-east-1.amazonaws.com/dev/books';

function App() {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isEditingBook, setIsEditingBook] = useState(false);
  const [currentBook, setCurrentBook] = useState({
    BookID: '',
    Title: '',
    Authors: '',
    Publisher: '',
    Year: '',
    imageUrl: '' // Added imageUrl to the state
  });
  const [currentBookImage, setCurrentBookImage] = useState(null); // New state for the image file

  const getSession = () => {
    const cognitoUser = UserPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                console.error("Error retrieving session:", err);
            } else {
                console.log("Session retrieved:", session);
                if (session.isValid()) {
                    console.log("Session is valid");
                    setUser(session);
                    loadBooks();  // Load books without needing the session token
                } else {
                    console.error("Session is invalid");
                }
            }
        });
    } else {
        console.error("No Cognito user found.");
    }
  };

  const loadBooks = async () => {
    try {
        const response = await axios.get(API_URL); // No need to pass JWT token
        setBooks(response.data);
    } catch (error) {
        console.error('Error loading books:', error);
    }
  };

  const handleSignOut = () => {
    const cognitoUser = UserPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
      setUser(null);
    }
  };

  const showAddBookForm = () => {
    setIsAddingBook(true);
    setIsEditingBook(false);
    setCurrentBook({
      BookID: '',
      Title: '',
      Authors: '',
      Publisher: '',
      Year: '',
      imageUrl: '' // Reset imageUrl
    });
    setCurrentBookImage(null); // Reset currentBookImage state
  };

  const hideBookForm = () => {
    setIsAddingBook(false);
    setIsEditingBook(false);
  };

  const handleAddBook = async () => {
    try {
        let imageUrl = '';

        if (currentBook.imageUrl) { // If an image URL already exists (e.g., for edits)
            imageUrl = currentBook.imageUrl;
        } else if (currentBookImage) { // If a new image file is provided
            imageUrl = await uploadImageToS3(currentBookImage);
        } else {
            imageUrl = 'https://book-collection-app-aug11.s3.amazonaws.com/images/default-book-cover.png'; // Fallback to default image URL
        }

        const newBook = { 
            ...currentBook, 
            BookID: new Date().getTime().toString(),
            imageUrl: imageUrl
        };

        const response = await axios.post(API_URL, newBook);
        setBooks([...books, newBook]);
        hideBookForm();
    } catch (error) {
        console.error('Error adding book:', error);
    }
};

  const showEditBookForm = (book) => {
    setIsAddingBook(false);
    setIsEditingBook(true);
    setCurrentBook(book);
    setCurrentBookImage(null); // Reset currentBookImage state when editing
  };

  const handleEditBook = async () => {
    try {
      let imageUrl = currentBook.imageUrl;
      if (currentBookImage) {
        imageUrl = await uploadImageToS3(currentBookImage); // Upload the image to S3 and get the URL
      }

      const updatedBook = { 
        ...currentBook, 
        imageUrl 
      };

      const response = await axios.put(`${API_URL}/${currentBook.BookID}`, updatedBook, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const updatedBooks = books.map(book => 
          book.BookID === updatedBook.BookID ? updatedBook : book
        );
        setBooks(updatedBooks);
        hideBookForm();
      } else {
        console.error('Failed to update book:', response.data);
      }
    } catch (error) {
      console.error('Error updating book:', error.response ? error.response.data : error.message);
    }
  };

  const handleDeleteBook = async (bookId) => {
    try {
      await axios.delete(`${API_URL}/${bookId}`);
      setBooks(books.filter(book => book.BookID !== bookId));
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCurrentBookImage(file); // Store the selected image file in state
    }
  };

  const uploadImageToS3 = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('https://your-s3-upload-endpoint', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      params: {
        // This assumes that your backend API is configured to accept and handle the 'folder' parameter
        folder: 'images/'  // Specify the folder within your S3 bucket
      }
    });

    return response.data.imageUrl; // Adjust based on your backend API response
  };

  useEffect(() => {
    getSession();
  }, []);

  return (
    <div className="app-container">
      {!user ? (
        <>
          <SignUp />
          <SignIn onSignInSuccess={getSession} />
          <VerifyAccount />
        </>
      ) : (
        <div>
          <div className="header">
            <div className="welcome-message">
              Welcome, {user.getIdToken().payload.email}!
            </div>
            <button className="sign-out-button" onClick={handleSignOut}>Sign Out</button>
          </div>
          
          <div id="dashboard-container">
            <div id="dashboard-header">
              <h1>Book Collection Dashboard</h1>
              <button className="btn-add" onClick={showAddBookForm}>Add Book</button>
            </div>
            <div id="book-list">
              {books.map(book => (
                <div key={book.BookID} className="book-card">
                  <img src={book.imageUrl} alt={`${book.Title} cover`} className="book-cover-image" />
                  <div className="book-title">{book.Title}</div>
                  <p><strong>Authors:</strong> {book.Authors}</p>
                  <p><strong>Publisher:</strong> {book.Publisher}</p>
                  <p><strong>Year:</strong> {book.Year}</p>
                  <button className="btn-edit" onClick={() => showEditBookForm(book)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDeleteBook(book.BookID)}>Delete</button>
                </div>
              ))}
            </div>
          </div>

          {(isAddingBook || isEditingBook) && (
            <div id="book-form">
              <h2>{isAddingBook ? 'Add Book' : 'Edit Book'}</h2>
              <input
                type="text"
                value={currentBook.Title}
                onChange={(e) => setCurrentBook({ ...currentBook, Title: e.target.value })}
                placeholder="Title"
              />
              <input
                type="text"
                value={currentBook.Authors}
                onChange={(e) => setCurrentBook({ ...currentBook, Authors: e.target.value })}
                placeholder="Authors"
              />
              <input
                type="text"
                value={currentBook.Publisher}
                onChange={(e) => setCurrentBook({ ...currentBook, Publisher: e.target.value })}
                placeholder="Publisher"
              />
              <input
                type="text"
                value={currentBook.Year}
                onChange={(e) => setCurrentBook({ ...currentBook, Year: e.target.value })}
                placeholder="Year"
              />
              <input
                type="file"
                onChange={handleImageUpload}  // Add this line for image upload
              />
              <button onClick={isAddingBook ? handleAddBook : handleEditBook}>
                {isAddingBook ? 'Save' : 'Update'}
              </button>
              <button className="btn-cancel" onClick={hideBookForm}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
