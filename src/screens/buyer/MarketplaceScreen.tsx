import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Scale,
  ShoppingBag,
  MapPin,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  IndianRupee,
} from 'lucide-react-native';
import api, { BASE_URL } from '../../api/client';
import { Colors } from '../../constants/theme';
import { Product, EvaluateOfferResponse, User } from '../../types';

export const MarketplaceScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [bargainModalVisible, setBargainModalVisible] = useState(false);
  const [offerInput, setOfferInput] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluateOfferResponse | null>(null);

  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutPrice, setCheckoutPrice] = useState<number>(0);
  const [purchasing, setPurchasing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    pincode: '',
  });

  const fetchMarketplace = async () => {
    try {
      const res = await api.get<Product[]>('/products/public/marketplace');
      setProducts(res.data);
    } catch (err: any) {
      Alert.alert('Marketplace Error', err.response?.data?.message || 'Could not load craft discovery feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMarketplace();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMarketplace();
  };

  const handleEvaluateOffer = async () => {
    const offerNum = Number(offerInput);
    if (!offerNum || offerNum <= 0) {
      Alert.alert('Invalid Offer', 'Please enter a valid rupee amount.');
      return;
    }

    if (!selectedProduct) return;

    setEvaluating(true);
    try {
      const res = await api.post<EvaluateOfferResponse>(
        `/products/${selectedProduct._id}/evaluate-offer`,
        { buyerOffer: offerNum }
      );
      setEvaluationResult(res.data);
    } catch (err: any) {
      Alert.alert('Evaluation Error', err.response?.data?.message || 'Failed to evaluate offer.');
    } finally {
      setEvaluating(false);
    }
  };

  const openCheckout = (product: Product, agreedPrice: number) => {
    setSelectedProduct(product);
    setCheckoutPrice(agreedPrice);
    setBargainModalVisible(false);
    setCheckoutModalVisible(true);
  };

  const handlePlaceOrder = async () => {
    const { fullName, phone, street, city, pincode } = shippingAddress;
    if (!fullName || !phone || !street || !city || !pincode) {
      Alert.alert('Address Missing', 'Please fill out all required shipping fields.');
      return;
    }

    if (!selectedProduct) return;

    setPurchasing(true);
    try {
      await api.post('/products/buy', {
        productId: selectedProduct._id,
        finalPrice: checkoutPrice,
        shippingAddress,
      });

      Alert.alert('Order Confirmed! 🎉', 'Your direct artisan craft order has been successfully placed.', [
        {
          text: 'View My Orders',
          onPress: () => {
            setCheckoutModalVisible(false);
            navigation.navigate('MyOrders');
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Purchase Failed', err.response?.data?.message || 'Failed to place order.');
    } finally {
      setPurchasing(false);
    }
  };

  // Robust URL resolution
  const resolveImageUrl = (img?: string) => {
    if (!img) return null;

    if (img.includes('localhost:5000') || img.includes('127.0.0.1:5000')) {
      return img
        .replace('http://localhost:5000', BASE_URL)
        .replace('http://127.0.0.1:5000', BASE_URL);
    }

    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }

    if (img.startsWith('/uploads/') || img.startsWith('uploads/')) {
      const cleanPath = img.startsWith('/') ? img : `/${img}`;
      return `${BASE_URL}${cleanPath}`;
    }

    return `${BASE_URL}/uploads/${img}`;
  };

  const renderCraftCard = ({ item }: { item: Product }) => {
    const artisanData = typeof item.artisan === 'object' ? (item.artisan as User) : null;
    const imageUrl = resolveImageUrl(item.imageUrl);

    return (
      <View style={styles.card}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.imageFallback}>
            <Sparkles size={32} color={Colors.neutral.muted} />
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.artisanHeader}>
            <View style={styles.artisanInfo}>
              <Text style={styles.artisanName}>{artisanData?.name || 'Master Artisan'}</Text>
              <View style={styles.locationRow}>
                <MapPin size={11} color={Colors.neutral.muted} />
                <Text style={styles.locationText}>{artisanData?.location || 'India'}</Text>
              </View>
            </View>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Tag size={10} color={Colors.buyer.primary} />
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            )}
          </View>

          <Text style={styles.productTitleEn}>{item.titleEn}</Text>
          {item.titleHi && <Text style={styles.productTitleHi}>{item.titleHi}</Text>}

          {item.descriptionEn && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {item.descriptionEn}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.priceLabel}>Fair Recommended Price</Text>
              <Text style={styles.priceValue}>₹{item.pricing.recommendedPrice}</Text>
            </View>

            <View style={styles.actionButtonGroup}>
              <TouchableOpacity
                style={styles.bargainButton}
                onPress={() => {
                  setSelectedProduct(item);
                  setOfferInput('');
                  setEvaluationResult(null);
                  setBargainModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Scale size={16} color={Colors.buyer.primary} />
                <Text style={styles.bargainButtonText}>Bargain</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buyButton}
                onPress={() => openCheckout(item, item.pricing.recommendedPrice)}
                activeOpacity={0.8}
              >
                <ShoppingBag size={16} color="#ffffff" />
                <Text style={styles.buyButtonText}>Buy Direct</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color={Colors.buyer.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderCraftCard}
        contentContainerStyle={styles.feedContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.buyer.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShoppingBag size={48} color={Colors.neutral.muted} />
            <Text style={styles.emptyTitle}>No crafts currently discoverable</Text>
            <Text style={styles.emptySubtitle}>
              Check back soon as artisans are listing newly created pieces.
            </Text>
          </View>
        }
      />

      <Modal
        visible={bargainModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBargainModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bargainModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Fair Trade Bargain Engine</Text>
                <Text style={styles.modalSubtitle}>Ethical counter-offer validation</Text>
              </View>
              <TouchableOpacity onPress={() => setBargainModalVisible(false)}>
                <X size={22} color={Colors.neutral.muted} />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.bargainCraftPreview}>
                  <Text style={styles.bargainCraftTitle}>{selectedProduct.titleEn}</Text>
                  <Text style={styles.bargainBenchText}>
                    Artisan benchmark: ₹{selectedProduct.pricing.recommendedPrice} | Floor: ₹{selectedProduct.pricing.floorPrice}
                  </Text>
                </View>

                <Text style={styles.inputFieldLabel}>Enter Your Proposed Offer (₹)</Text>
                <View style={styles.offerInputWrapper}>
                  <IndianRupee size={18} color={Colors.buyer.primary} />
                  <TextInput
                    style={styles.offerInput}
                    placeholder={`e.g. ${selectedProduct.pricing.floorPrice + 50}`}
                    keyboardType="numeric"
                    value={offerInput}
                    onChangeText={setOfferInput}
                  />
                  <TouchableOpacity
                    style={styles.evalButton}
                    onPress={handleEvaluateOffer}
                    disabled={evaluating}
                  >
                    {evaluating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.evalButtonText}>Evaluate</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {evaluationResult && (
                  <View
                    style={[
                      styles.evalResultCard,
                      evaluationResult.status === 'accepted_fair' && styles.evalAccepted,
                      evaluationResult.status === 'negotiable' && styles.evalNegotiable,
                      evaluationResult.status === 'rejected_below_floor' && styles.evalRejected,
                    ]}
                  >
                    <View style={styles.evalCardHeader}>
                      {evaluationResult.status === 'accepted_fair' && (
                        <CheckCircle2 size={20} color={Colors.feedback.success} />
                      )}
                      {evaluationResult.status === 'negotiable' && (
                        <AlertTriangle size={20} color={Colors.feedback.warning} />
                      )}
                      {evaluationResult.status === 'rejected_below_floor' && (
                        <XCircle size={20} color={Colors.feedback.alert} />
                      )}
                      <Text
                        style={[
                          styles.evalStatusTitle,
                          evaluationResult.status === 'accepted_fair' && { color: Colors.feedback.success },
                          evaluationResult.status === 'negotiable' && { color: Colors.feedback.warning },
                          evaluationResult.status === 'rejected_below_floor' && { color: Colors.feedback.alert },
                        ]}
                      >
                        {evaluationResult.status === 'accepted_fair'
                          ? 'Fair Living-Wage Offer!'
                          : evaluationResult.status === 'negotiable'
                          ? 'Counter-Offer Suggested'
                          : 'Offer Below Living Wage'}
                      </Text>
                    </View>

                    <Text style={styles.evalMessage}>{evaluationResult.message}</Text>

                    {evaluationResult.suggestedCounter && (
                      <View style={styles.counterActionBox}>
                        <Text style={styles.counterText}>
                          Recommended Compromise: <Text style={styles.counterHighlight}>₹{evaluationResult.suggestedCounter}</Text>
                        </Text>
                        <TouchableOpacity
                          style={styles.acceptCounterBtn}
                          onPress={() => openCheckout(selectedProduct, evaluationResult.suggestedCounter!)}
                        >
                          <Text style={styles.acceptCounterBtnText}>
                            Accept & Proceed to Checkout (₹{evaluationResult.suggestedCounter})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {evaluationResult.status === 'accepted_fair' && (
                      <TouchableOpacity
                        style={[styles.acceptCounterBtn, { backgroundColor: Colors.feedback.success }]}
                        onPress={() => openCheckout(selectedProduct, Number(offerInput))}
                      >
                        <Text style={styles.acceptCounterBtnText}>Proceed with Offer (₹{offerInput})</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={checkoutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.checkoutModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Confirm Order</Text>
                <Text style={styles.modalSubtitle}>Direct Artisan Payment & Dispatch</Text>
              </View>
              <TouchableOpacity onPress={() => setCheckoutModalVisible(false)}>
                <X size={22} color={Colors.neutral.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.orderSummaryRibbon}>
                <Text style={styles.orderSummaryTitle}>{selectedProduct?.titleEn}</Text>
                <Text style={styles.orderSummaryPrice}>Total: ₹{checkoutPrice}</Text>
              </View>

              <Text style={styles.shippingSectionHeader}>Delivery Address</Text>

              <TextInput
                style={styles.checkoutInput}
                placeholder="Full Name / Receiver's Name"
                value={shippingAddress.fullName}
                onChangeText={(t) => setShippingAddress({ ...shippingAddress, fullName: t })}
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder="Contact Phone Number"
                keyboardType="phone-pad"
                value={shippingAddress.phone}
                onChangeText={(t) => setShippingAddress({ ...shippingAddress, phone: t })}
              />
              <TextInput
                style={styles.checkoutInput}
                placeholder="Street Address, House/Flat No."
                value={shippingAddress.street}
                onChangeText={(t) => setShippingAddress({ ...shippingAddress, street: t })}
              />
              <View style={styles.checkoutSplitRow}>
                <TextInput
                  style={[styles.checkoutInput, { flex: 1 }]}
                  placeholder="City"
                  value={shippingAddress.city}
                  onChangeText={(t) => setShippingAddress({ ...shippingAddress, city: t })}
                />
                <TextInput
                  style={[styles.checkoutInput, { flex: 1 }]}
                  placeholder="PIN Code"
                  keyboardType="numeric"
                  value={shippingAddress.pincode}
                  onChangeText={(t) => setShippingAddress({ ...shippingAddress, pincode: t })}
                />
              </View>

              <TouchableOpacity
                style={styles.confirmPayButton}
                onPress={handlePlaceOrder}
                disabled={purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmPayButtonText}>Place Order (₹{checkoutPrice})</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContainer: {
    padding: 14,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.neutral.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 210,
    resizeMode: 'cover',
  },
  imageFallback: {
    width: '100%',
    height: 180,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    padding: 14,
  },
  artisanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  artisanInfo: {
    flex: 1,
  },
  artisanName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.buyer.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: Colors.neutral.muted,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.buyer.light,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: Colors.buyer.primary,
    fontWeight: '600',
  },
  productTitleEn: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.neutral.text,
  },
  productTitleHi: {
    fontSize: 14,
    color: Colors.neutral.muted,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.neutral.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    paddingTop: 12,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.neutral.muted,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.neutral.text,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  bargainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.buyer.primary,
    backgroundColor: Colors.buyer.light,
  },
  bargainButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.buyer.primary,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.buyer.primary,
  },
  buyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.neutral.muted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bargainModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  checkoutModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.neutral.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.neutral.muted,
    marginTop: 2,
  },
  bargainCraftPreview: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.buyer.light,
    marginBottom: 16,
  },
  bargainCraftTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.buyer.primary,
  },
  bargainBenchText: {
    fontSize: 12,
    color: Colors.neutral.muted,
    marginTop: 4,
  },
  inputFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.text,
    marginBottom: 6,
  },
  offerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  offerInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.text,
  },
  evalButton: {
    backgroundColor: Colors.buyer.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  evalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  evalResultCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  evalAccepted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  evalNegotiable: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  evalRejected: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  evalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  evalStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  evalMessage: {
    fontSize: 13,
    color: Colors.neutral.text,
    lineHeight: 18,
    marginBottom: 10,
  },
  counterActionBox: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    marginTop: 6,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.text,
    marginBottom: 8,
  },
  counterHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.buyer.primary,
  },
  acceptCounterBtn: {
    backgroundColor: Colors.buyer.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptCounterBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  orderSummaryRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.neutral.background,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: 16,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral.text,
    flex: 1,
  },
  orderSummaryPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.buyer.primary,
  },
  shippingSectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.neutral.text,
    marginBottom: 10,
  },
  checkoutInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: Colors.neutral.background,
    marginBottom: 10,
  },
  checkoutSplitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmPayButton: {
    backgroundColor: Colors.feedback.success,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  confirmPayButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
});