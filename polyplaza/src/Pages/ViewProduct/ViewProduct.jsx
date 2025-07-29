import { useSearchParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { supabase } from "../../supabase"
import Review from "./components/Review"
import BuyButton from "./components/BuyButton"
import QuantityButton from "./components/QuantityButton"
import EditButton from "./components/EditButton"
import CreateReview from "./components/CreateReview"
import CartButton from "./components/CartButton"
import { Star, Package, Store, ChevronDown, ChevronUp, Box } from "lucide-react"
import ProductPriceHistoryLineChart from "./components/PriceHistory"
import ProductMonthlyStats from "./components/ProductMonthlyStats"



function ViewProduct() {
  const [item, setItem] = useState([])
  const [sellerQuantity, setSellerQuantity] = useState([])
  const [reviewAverage, setReviewAverage] = useState(0)
  const [sellerReview, setSellerReview] = useState([])
  const [searchParams] = useSearchParams()
  const productId = Number(searchParams.get("productId"))

  const [quantity, setQuantity] = useState(1)
  const [showReviews, setShowReviews] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    async function fetchItems() {
      const query = supabase.from("product").select(`
        product_id,
        name,
        description,
        category,
        price,
        quantity,
        product_image (
          image_url
        ),
        seller (
          seller_id,
          seller_name,
          is_deleted,
          address (street, city, postal_code),
          buyer (buyer_id)
        ),
        review (
          rating,
          comment,
          created_at,
          buyer (
            first_name, last_name, email)
        ),
        order_item (
          quantity
        ),
        price_history (
          price,
          date_set
        )
      `)

      const { data, error } = await query.eq("product_id", productId).single()

      if (error) {
        console.error("Error fetching items:", error)
        return
      }

      const { data: data2 } = await supabase
        .from("product")
        .select(`
        product_id,
        order_item(quantity),
        review (
          rating
        )
      `)
        .eq("seller_id", data.seller.seller_id)

      setReviewAverage(getAverageRating(data.review))
      getSellerRatings(data2)

      setItem(data)
      setSellerQuantity(data2)
    }

    fetchItems()
  }, [productId])

  // Reset quantity when item changes or if current quantity exceeds available stock
  useEffect(() => {
    if (item.quantity && quantity > item.quantity) {
      setQuantity(Math.min(quantity, item.quantity))
    }
  }, [item.quantity, quantity])

  function getAverageRating(reviews) {
    const ratings = reviews?.map((r) => r.rating) || []
    if (ratings.length === 0) return 0
    return ratings.reduce((a, b) => a + b, 0) / ratings.length
  }

  function getTotalQuantity(products) {
    return products.reduce((total, product) => {
      const productTotal = product.order_item?.reduce((sum, item) => sum + item.quantity, 0) || 0
      return total + productTotal
    }, 0)
  }

  function getSellerRatings(products) {
    let totalQuantity = 0
    let totalRating = 0
    let totalReviews = 0

    products.forEach((product) => {
      if (Array.isArray(product.order_item)) {
        product.order_item.forEach((item) => {
          totalQuantity += item.quantity || 0
        })
      }

      if (Array.isArray(product.review)) {
        product.review.forEach((r) => {
          totalRating += r.rating || 0
          totalReviews += 1
        })
      }
    })

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0
    setSellerReview(() => ({
      totalQuantity,
      averageRating: Number(averageRating.toFixed(2)),
    }))
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ))
  }

  if(item.is_deleted || item.seller?.is_deleted) 
    return <div className="min-h-screen min-w-screen bg-gray-50 font-extrabold text-neutral-900 flex justify-center items-center text-6xl">Product is disabled</div>
  // Check if product is out of stock
  const isOutOfStock = !item.quantity || item.quantity <= 0

  return (
    <div className="min-h-screen min-w-screen bg-gray-50 text-neutral-700 ">
      <div className="p-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <div className="aspect-square bg-gray-100 flex justify-center items-center w-80 rounded-2xl overflow-hidden mb-4">
                  {item.product_image?.[selectedImageIndex] && (
                    <img
                      style={{ imageRendering: "pixelated" }}
                      src={item.product_image[selectedImageIndex].image_url || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>

                {/* Image Thumbnails */}
                {item.product_image?.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {item.product_image.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors duration-200 ${
                          selectedImageIndex === index ? "border-blue-500" : "border-gray-200"
                        }`}
                      >
                        <img
                          src={image.image_url || "/placeholder.svg"}
                          alt={`${item.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price History */}
              <ProductPriceHistoryLineChart productId={productId} />
      
{/* Monthly Sales & Revenue */}
<ProductMonthlyStats productId={productId} />
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-3">
                    {item.category}
                  </span>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{item.name}</h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-1">
                      {renderStars(reviewAverage)}
                      <span className="text-sm text-gray-600 ml-2">({item.review?.length || 0} reviews)</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="flex flex-row">
                        <Package className="w-4 h-4 mr-1" />
                        <p>{item.order_item?.length || 0} sold</p>
                        <Box className="w-4 h-4 ml-5" />
                        <p className={`ml-1 ${isOutOfStock ? "text-red-600 font-semibold" : ""}`}>
                          {isOutOfStock ? "Out of Stock" : `${item.quantity} items left`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-5xl font-bold text-blue-600 mb-4">₱{item.price?.toLocaleString()}</p>
                  <p className="text-gray-700 text-lg leading-relaxed">{item.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-6">
                  {!isOutOfStock && (
                    <div className="flex items-center space-x-4 mb-6">
                      <QuantityButton quantity={quantity} setQuantity={setQuantity} availableStock={item.quantity} />
                    </div>
                  )}

                  {isOutOfStock ? (
                    <div className="text-center py-4">
                      <p className="text-red-600 font-semibold text-lg mb-2">This product is currently out of stock</p>
                      <p className="text-gray-600">Please check back later or contact the seller</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <BuyButton productId={item.product_id} quantity={quantity} />
                      <CartButton productId={item.product_id} quantity={quantity} />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <EditButton productId={item.product_id} />
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <Store className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">Store Information</h2>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.seller?.seller_name}</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {getTotalQuantity(sellerQuantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Products Sold</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        {renderStars(sellerReview.averageRating)}
                      </div>
                      <p className="text-sm text-gray-600">{sellerReview.averageRating} Rating</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    {sellerReview.totalQuantity} total reviews across all products
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Star className="w-6 h-6 text-yellow-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Reviews ({item.review?.length || 0})</h2>
              </div>
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors duration-200"
              >
                <span className="font-medium text-gray-700">{showReviews ? "Hide Reviews" : "Show Reviews"}</span>
                {showReviews ? (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>

            {showReviews && (
              <div className="space-y-4 mb-6">
                {item.review?.length > 0 ? (
                  item.review.map((review, index) => <Review key={index} review={review} />)
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </div>
            )}

            <CreateReview productId={item.product_id} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewProduct
