import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './ProductDetails.css';

const ProductDetails = ({ addToCart, loggedIn, userData }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [sortOption, setSortOption] = useState('date_desc');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState(false);
  const [editReviewRating, setEditReviewRating] = useState(1);
  const [editReviewText, setEditReviewText] = useState('');
  const [editReviewId, setEditReviewId] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/product/${id}`)
      .then(response => {
        const productData = response.data;
        // Parsowanie zdjęć, jeśli są zapisane jako string JSON
        const images = productData.photos ? JSON.parse(productData.photos).photos : [];
        setProduct({...productData, photos: images});  // Przechowujemy również zdjęcia jako tablicę
      })
      .catch(error => {
        console.error('Błąd pobierania danych: ', error);
      });
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [id, sortOption]);

  const fetchReviews = () => {
    axios.get(`http://localhost:5000/reviews/${id}?sort=${sortOption}`)
      .then(response => {
        setReviews(response.data);
        const userReview = response.data.find(review => review.id_usera === userData.id);
        setHasReviewed(!!userReview); // Ustawiamy true, jeśli istnieje opinia użytkownika
      })
      .catch(error => {
        console.error('Błąd pobierania opinii: ', error);
      });
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    setQuantity(isNaN(value) ? 1 : Math.max(1, value));
  };

  const handleNextImage = () => {
    if (product && product.photos.length > 0) {
      setCurrentImageIndex((currentImageIndex + 1) % product.photos.length);
    }
  };

  const handlePrevImage = () => {
    if (product && product.photos.length > 0) {
      setCurrentImageIndex((currentImageIndex - 1 + product.photos.length) % product.photos.length);
    }
  };

  const handleOpenReviewModal = () => {
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
  };

  const handleOpenEditReviewModal = (review) => {
    setEditReviewRating(review.ocena);
    setEditReviewText(review.tresc);
    setEditReviewId(review.id);
    setIsEditReviewModalOpen(true);
  };

  const handleCloseEditReviewModal = () => {
    setIsEditReviewModalOpen(false);
  };

  const handleRatingChange = (e) => {
    setReviewRating(parseInt(e.target.value));
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handleSubmitReview = () => {
    const reviewData = {
      id_produktu: id,
      id_usera: userData.id,
      ocena: reviewRating,
      tresc: reviewText
    };

    axios.post('http://localhost:5000/addreview', reviewData)
      .then(response => {
        console.log(response.data.message);
        setIsReviewModalOpen(false);
        fetchReviews(); // Po dodaniu opinii pobieramy ponownie opinie dla aktualnego produktu
      })
      .catch(error => {
        console.error('Błąd dodawania opinii: ', error);
      });
  };

  const handleUpdateReview = () => {
    const reviewData = {
      id: editReviewId,
      ocena: editReviewRating,
      tresc: editReviewText
    };

    axios.put('http://localhost:5000/updatereview', reviewData)
      .then(response => {
        console.log(response.data.message);
        setIsEditReviewModalOpen(false);
        fetchReviews(); // Po aktualizacji opinii pobieramy ponownie opinie dla aktualnego produktu
      })
      .catch(error => {
        console.error('Błąd aktualizacji opinii: ', error);
      });
  };

  const handleDeleteReview = (reviewId) => {
    axios.get(`http://localhost:5000/deletereview/${reviewId}`)
      .then(response => {
        console.log(response.data.message);
        fetchReviews(); // Pobieramy opinie ponownie po usunięciu
      })
      .catch(error => {
        console.error('Błąd usuwania opinii: ', error);
      });
  };

  if (!product) {
    return <div>Ładowanie...</div>;
  }

  const productImages = product.photos || [];  // Używamy photos z produktu, jeśli są dostępne

  return (
    <div className="product-details-container">
      <div style={{ padding: '20px', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="image-container">
            <button className="prev" onClick={handlePrevImage}>&#10094;</button>
            {productImages.length > 0 && (
              <img
                src={productImages[currentImageIndex]}
                alt={product.nazwa}
                className="product-image"
              />
            )}
            <button className="next" onClick={handleNextImage}>&#10095;</button>
          </div>
          <div style={{ flex: '1', textAlign: 'center' }}>
            <h2>{product.nazwa}</h2>
            <p>Cena: {product.cena} zł</p>
            <p>Producent: {product.producent}</p>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              style={{ marginRight: '10px', width: '60px' }}
            />
            <button
              className="add-to-cart-button"
              onClick={() => addToCart({ ...product, quantity })}
            >
              Dodaj do koszyka
            </button>
          </div>
        </div>
        <div className="description-container">
          <div className="description">
            <h3>Opis produktu</h3>
            <p>{product.opis}</p>
          </div>
        </div>
        <div className="reviews-container">
          <h3 className="reviews-title">Opinie</h3>
          <div className="sort-select-container">
            <select
              value={sortOption}
              onChange={handleSortChange}
              className="sort-select"
            >
              <option value="date_asc">Data rosnąco</option>
              <option value="date_desc">Data malejąco</option>
              <option value="rating_asc">Ocena rosnąco</option>
              <option value="rating_desc">Ocena malejąco</option>
            </select>
          </div>
          <div className="write-review-button-container">
            {loggedIn && !hasReviewed && (
              <button onClick={handleOpenReviewModal} className="write-review-button">
                Napisz opinię
              </button>
            )}
            {loggedIn && hasReviewed && (
              <p>Napisałeś już opinię tego produktu</p>
            )}
          </div>
          {reviews.map((review, index) => (
            <div key={index} className="review">
              <p>Ocena: {review.ocena}/5</p>
              <div className="review-date">{review.data.split('T')[0]}</div>
              <p>{review.tresc}</p>
              {loggedIn && review.id_usera === userData.id && (
                <div>
                  <button onClick={() => handleOpenEditReviewModal(review)}>Edytuj</button>
                  <button onClick={() => handleDeleteReview(review.id)}>Usuń</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {isReviewModalOpen && (
          <div className="review-modal">
            <div className="review-modal-content">
              <button className="close-button" onClick={handleCloseReviewModal}>&times;</button>
              <h3>Napisz opinię</h3>
              <select value={reviewRating} onChange={handleRatingChange}>
                {[1, 2, 3, 4, 5].map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <textarea
                placeholder="Twoja opinia..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              ></textarea>
              <div>
                <button onClick={handleSubmitReview}>Wyślij</button>
              </div>
            </div>
          </div>
        )}
        {isEditReviewModalOpen && (
          <div className="review-modal">
            <div className="review-modal-content">
              <button className="close-button" onClick={handleCloseEditReviewModal}>&times;</button>
              <h3>Edytuj opinię</h3>
              <select value={editReviewRating} onChange={(e) => setEditReviewRating(parseInt(e.target.value))}>
                {[1, 2, 3, 4, 5].map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <textarea
                value={editReviewText}
                onChange={(e) => setEditReviewText(e.target.value)}
              ></textarea>
              <div>
                <button onClick={handleUpdateReview}>Zapisz</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
