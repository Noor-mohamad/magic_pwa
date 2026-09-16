import React, { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

const STAR_PATH =
    'M7.24805 0.734375L9.22301 5.01608L13.9054 5.57126L10.4436 8.77267L11.3625 13.3975L7.24805 11.0944L3.13355 13.3975L4.0525 8.77267L0.590651 5.57126L5.27309 5.01608L7.24805 0.734375Z';

const Star = ({ filled, onClick, size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onClick={onClick}
        style={onClick ? { cursor: 'pointer' } : undefined}
    >
        <path d={STAR_PATH} fill={filled ? '#FF8A00' : '#E4E5E8'} />
    </svg>
);

const StarRow = ({ rating, size }) => {
    // average_rating comes back as a percentage (0-100), same
    // convention as rating_summary used everywhere else in this
    // project — round to the nearest of 5 stars.
    const filled = rating ? Math.round((rating / 100) * 5) : 0;
    return (
        <ul className="dz-rating me-2" style={{ display: 'inline-flex', gap: 2, padding: 0, margin: 0 }}>
            {[0, 1, 2, 3, 4].map(i => (
                <li key={i} style={{ listStyle: 'none' }}>
                    <Star filled={i < filled} size={size} />
                </li>
            ))}
        </ul>
    );
};

const GET_RATINGS_METADATA = gql`
    query getMoonCartProductReviewRatingsMetadata {
        productReviewRatingsMetadata {
            items {
                id
                name
                values {
                    value_id
                    value
                }
            }
        }
    }
`;

const CREATE_PRODUCT_REVIEW = gql`
    mutation createMoonCartProductReview($input: CreateProductReviewInput!) {
        createProductReview(input: $input) {
            review {
                nickname
                summary
                text
                created_at
                average_rating
            }
        }
    }
`;

/**
 * Theme port of product-thumbnail.html's "Reviews" tab — the theme's
 * own demo content there is a generic WordPress-style comment thread
 * with no star ratings at all (no rating UI in the comment list or
 * the form); real Magento reviews always carry a rating, so a star
 * row per review and a clickable 5-star input in the form are added
 * here, styled to match the rest of the theme's own star iconography
 * (same SVG path used everywhere else in this project) rather than
 * ported from a matching theme element that doesn't exist.
 *
 * List and submission are both real: GET_RATINGS_METADATA /
 * CREATE_PRODUCT_REVIEW are the real Magento_ReviewGraphQl schema
 * (confirmed live: this store has product reviews and guest reviews
 * both enabled). A successful submission is appended to the visible
 * list immediately from the mutation's own response — no need for a
 * follow-up refetch.
 */
const ProductReviews = ({ sku, reviewCount, reviews }) => {
    const [items, setItems] = useState(reviews || []);
    const [nickname, setNickname] = useState('');
    const [summary, setSummary] = useState('');
    const [text, setText] = useState('');
    const [ratingValueId, setRatingValueId] = useState(null);
    const [status, setStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const { data: ratingsData } = useQuery(GET_RATINGS_METADATA);
    const ratingMetadata = ratingsData?.productReviewRatingsMetadata?.items?.[0];

    const [createProductReview, { loading: isSubmitting }] = useMutation(
        CREATE_PRODUCT_REVIEW
    );

    const handleSubmit = async e => {
        e.preventDefault();
        if (!ratingMetadata || !ratingValueId) {
            setStatus('error');
            setErrorMessage('Please choose a star rating.');
            return;
        }

        setStatus(null);
        try {
            const { data } = await createProductReview({
                variables: {
                    input: {
                        sku,
                        nickname,
                        summary,
                        text,
                        ratings: [
                            { id: ratingMetadata.id, value_id: ratingValueId }
                        ]
                    }
                }
            });

            const newReview = data?.createProductReview?.review;
            if (newReview) {
                setItems(prev => [newReview, ...prev]);
            }
            setStatus('success');
            setNickname('');
            setSummary('');
            setText('');
            setRatingValueId(null);
        } catch (err) {
            setStatus('error');
            setErrorMessage(
                err?.message || 'Something went wrong submitting your review. Please try again.'
            );
        }
    };

    return (
        <div className="clear" id="comment-list">
            <div className="post-comments comments-area style-1 clearfix">
                <h4 className="comments-title mb-2">
                    Reviews ({reviewCount || items.length})
                </h4>
                {items.length === 0 ? (
                    <p className="dz-title-text">
                        No reviews yet — be the first to review this product.
                    </p>
                ) : (
                    <ol className="comment-list">
                        {items.map((review, index) => (
                            <li className="comment" key={index}>
                                <div className="comment-body">
                                    <div className="comment-author vcard d-flex align-items-center">
                                        <cite className="fn">{review.nickname}</cite>
                                        <StarRow rating={review.average_rating} size={14} />
                                    </div>
                                    <h6 className="mb-1">{review.summary}</h6>
                                    <div className="comment-content dz-page-text">
                                        <p>{review.text}</p>
                                    </div>
                                    <span className="text-muted font-13">
                                        {review.created_at}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
            <div className="default-form comment-respond style-1" id="respond">
                <h4 className="comment-reply-title mb-2" id="reply-title">
                    Write a Review
                </h4>
                {status === 'success' && (
                    <div className="alert alert-success">
                        Thanks — your review was submitted.
                    </div>
                )}
                {status === 'error' && (
                    <div className="alert alert-danger">{errorMessage}</div>
                )}
                <div className="clearfix">
                    <form className="comment-form" onSubmit={handleSubmit}>
                        <p>
                            <label className="form-label d-block">Your Rating</label>
                            <span style={{ display: 'inline-flex', gap: 4 }}>
                                {(ratingMetadata?.values || []).map(value => (
                                    <Star
                                        key={value.value_id}
                                        size={22}
                                        filled={
                                            ratingMetadata.values.findIndex(
                                                v => v.value_id === value.value_id
                                            ) <=
                                            ratingMetadata.values.findIndex(
                                                v => v.value_id === ratingValueId
                                            )
                                        }
                                        onClick={() => setRatingValueId(value.value_id)}
                                    />
                                ))}
                            </span>
                        </p>
                        <p className="comment-form-author">
                            <input
                                placeholder="Your Name"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                required
                            />
                        </p>
                        <p className="comment-form-author">
                            <input
                                placeholder="Review Title"
                                value={summary}
                                onChange={e => setSummary(e.target.value)}
                                required
                            />
                        </p>
                        <p className="comment-form-comment">
                            <textarea
                                placeholder="Type your review here"
                                className="form-control4"
                                cols={45}
                                rows={3}
                                value={text}
                                onChange={e => setText(e.target.value)}
                                required
                            />
                        </p>
                        <p className="form-submit">
                            <button
                                type="submit"
                                className="submit btn btn-secondary btnhover3 filled"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting…' : 'Submit Review'}
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProductReviews;
