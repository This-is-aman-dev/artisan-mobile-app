import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Package,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle,
} from 'lucide-react-native';
import api, { BASE_URL } from '../../api/client';
import { Colors } from '../../constants/theme';
import { Order, User, Product } from '../../types';

export const MyOrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await api.get<Order[]>('/products/my-orders');
      setOrders(response.data);
    } catch (err: any) {
      Alert.alert('Orders Error', err.response?.data?.message || 'Could not load order history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCallArtisan = (phone?: string) => {
    if (!phone) {
      Alert.alert('Unavailable', 'Artisan contact number is not provided.');
      return;
    }
    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Dialer Error', 'Unable to initiate phone call on this device.');
        }
      })
      .catch((err) => console.error('Dialer launch error:', err));
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

  const renderOrderItem = ({ item }: { item: Order }) => {
    const product = typeof item.product === 'object' ? (item.product as Product) : null;
    const artisan = typeof item.artisan === 'object' ? (item.artisan as User) : null;
    const imageUrl = resolveImageUrl(product?.imageUrl);

    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Recently';

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.dateRow}>
            <Calendar size={13} color={Colors.neutral.muted} />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <View style={styles.statusBadge}>
            <CheckCircle size={12} color={Colors.feedback.success} />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.productRow}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Sparkles size={24} color={Colors.neutral.muted} />
            </View>
          )}

          <View style={styles.productInfo}>
            <Text style={styles.productTitleEn} numberOfLines={1}>
              {product?.titleEn || 'Handmade Craft Piece'}
            </Text>
            {product?.titleHi && (
              <Text style={styles.productTitleHi} numberOfLines={1}>
                {product.titleHi}
              </Text>
            )}

            <View style={styles.paidRow}>
              <Text style={styles.paidLabel}>Paid Amount:</Text>
              <Text style={styles.paidValue}>₹{item.finalPrice}</Text>
            </View>
          </View>
        </View>

        <View style={styles.artisanBar}>
          <View style={styles.artisanDetails}>
            <Text style={styles.artisanName}>{artisan?.name || 'Master Craftsman'}</Text>
            <Text style={styles.craftSpecialty}>
              {artisan?.craftSpecialty || 'Traditional Crafts'} • {artisan?.location || 'India'}
            </Text>
          </View>

          {artisan?.phone && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCallArtisan(artisan.phone)}
              activeOpacity={0.8}
            >
              <Phone size={14} color="#ffffff" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.shippingSummary}>
          <MapPin size={14} color={Colors.buyer.primary} style={{ marginTop: 2 }} />
          <Text style={styles.addressText} numberOfLines={2}>
            Ship to: <Text style={styles.addressBold}>{item.shippingAddress.fullName}</Text> (
            {item.shippingAddress.phone}), {item.shippingAddress.street},{' '}
            {item.shippingAddress.city} - {item.shippingAddress.pincode}
          </Text>
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
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.buyer.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={48} color={Colors.neutral.muted} />
            <Text style={styles.emptyTitle}>No orders placed yet</Text>
            <Text style={styles.emptySubtitle}>
              Explore authentic crafts directly from rural makers in the Discover tab.
            </Text>
          </View>
        }
      />
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
  listContainer: {
    padding: 14,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: Colors.neutral.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: 14,
    marginBottom: 14,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
    paddingBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: Colors.neutral.muted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.feedback.success,
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: Colors.neutral.background,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitleEn: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.text,
  },
  productTitleHi: {
    fontSize: 13,
    color: Colors.neutral.muted,
    marginBottom: 4,
  },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  paidLabel: {
    fontSize: 12,
    color: Colors.neutral.muted,
  },
  paidValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.buyer.primary,
  },
  artisanBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.buyer.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  artisanDetails: {
    flex: 1,
  },
  artisanName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.buyer.primary,
  },
  craftSpecialty: {
    fontSize: 11,
    color: Colors.neutral.muted,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.buyer.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  callButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  shippingSummary: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.neutral.background,
    padding: 8,
    borderRadius: 8,
  },
  addressText: {
    fontSize: 11,
    color: Colors.neutral.muted,
    lineHeight: 16,
    flex: 1,
  },
  addressBold: {
    fontWeight: '700',
    color: Colors.neutral.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
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
    lineHeight: 18,
  },
});