import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Package,
  IndianRupee,
  Share2,
  Trash2,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import api, { BASE_URL } from '../../api/client';
import { Colors } from '../../constants/theme';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const InventoryScreen = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInventory = async () => {
    try {
      const response = await api.get<Product[]>('/products/all');
      setProducts(response.data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to fetch inventory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const toggleStatus = async (productId: string, currentStatus: 'available' | 'sold_out') => {
    const newStatus = currentStatus === 'available' ? 'sold_out' : 'available';

    setProducts((prev) =>
      prev.map((item) => (item._id === productId ? { ...item, status: newStatus } : item))
    );

    try {
      await api.patch(`/products/${productId}/status`, { status: newStatus });
    } catch (err: any) {
      setProducts((prev) =>
        prev.map((item) => (item._id === productId ? { ...item, status: currentStatus } : item))
      );
      Alert.alert('Update Failed', 'Could not change stock status.');
    }
  };

  const handleDelete = (productId: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to remove this craft from your inventory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${productId}`);
              setProducts((prev) => prev.filter((item) => item._id !== productId));
            } catch (err: any) {
              Alert.alert('Delete Failed', err.response?.data?.message || 'Could not delete item.');
            }
          },
        },
      ]
    );
  };

  const handleWhatsAppShare = (item: Product) => {
    const message =
      `Namaste! Check out this handmade craft:\n\n` +
      `*${item.titleEn}* (${item.titleHi || ''})\n` +
      `Category: ${item.category || 'Traditional Craft'}\n` +
      `Fair Price: ₹${item.pricing.recommendedPrice}\n\n` +
      `"${item.descriptionEn || ''}"\n\n` +
      `Crafted by: ${user?.name || 'Artisan'} (${user?.location || 'India'})\n` +
      `Direct Contact: ${user?.phone || ''}`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('WhatsApp Not Installed', 'WhatsApp is required to share craft details directly.');
        }
      })
      .catch((err) => console.error('Error sharing to WhatsApp', err));
  };

  const activeItems = products.filter((p) => p.status === 'available');
  const soldItems = products.filter((p) => p.status === 'sold_out');
  const totalValuation = activeItems.reduce(
    (sum, p) => sum + (p.pricing?.recommendedPrice || 0),
    0
  );

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

  const renderProductItem = ({ item }: { item: Product }) => {
    const isAvailable = item.status === 'available';
    const imageUrl = resolveImageUrl(item.imageUrl);

    return (
      <View style={[styles.productCard, !isAvailable && styles.cardSoldOut]}>
        <View style={styles.cardHeader}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Sparkles size={24} color={Colors.neutral.muted} />
            </View>
          )}

          <View style={styles.productMainDetails}>
            <View style={styles.statusBadgeRow}>
              <View
                style={[
                  styles.statusBadge,
                  isAvailable ? styles.badgeAvailable : styles.badgeSold,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isAvailable ? styles.badgeTextAvailable : styles.badgeTextSold,
                  ]}
                >
                  {isAvailable ? 'IN STOCK' : 'SOLD OUT'}
                </Text>
              </View>
              {item.category && (
                <View style={styles.categoryBadge}>
                  <Tag size={10} color={Colors.neutral.muted} />
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
              )}
            </View>

            <Text style={styles.productTitleEn} numberOfLines={1}>
              {item.titleEn}
            </Text>
            {item.titleHi && (
              <Text style={styles.productTitleHi} numberOfLines={1}>
                {item.titleHi}
              </Text>
            )}

            <View style={styles.pricingSummaryRow}>
              <Text style={styles.recPriceText}>₹{item.pricing.recommendedPrice}</Text>
              <Text style={styles.floorPriceText}>Floor: ₹{item.pricing.floorPrice}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardToolbar}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>In Stock</Text>
            <Switch
              value={isAvailable}
              onValueChange={() => toggleStatus(item._id, item.status)}
              trackColor={{ false: Colors.neutral.border, true: Colors.artisan.light }}
              thumbColor={isAvailable ? Colors.artisan.primary : '#94a3b8'}
            />
          </View>

          <View style={styles.actionButtonsGroup}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => handleWhatsAppShare(item)}
              activeOpacity={0.7}
            >
              <Share2 size={16} color="#15803d" />
              <Text style={styles.shareBtnText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item._id)}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={Colors.feedback.alert} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color={Colors.artisan.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Package size={20} color={Colors.artisan.primary} />
          <Text style={styles.kpiValue}>{activeItems.length}</Text>
          <Text style={styles.kpiLabel}>Active Crafts</Text>
        </View>

        <View style={styles.kpiCard}>
          <IndianRupee size={20} color={Colors.feedback.success} />
          <Text style={styles.kpiValue}>₹{totalValuation.toLocaleString('en-IN')}</Text>
          <Text style={styles.kpiLabel}>Valuation</Text>
        </View>

        <View style={styles.kpiCard}>
          <Clock size={20} color={Colors.neutral.muted} />
          <Text style={styles.kpiValue}>{soldItems.length}</Text>
          <Text style={styles.kpiLabel}>Sold Out</Text>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.artisan.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={48} color={Colors.neutral.muted} />
            <Text style={styles.emptyTitle}>No crafts in inventory</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add Craft" below to catalogue your first piece using voice or camera.
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
  kpiContainer: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
    backgroundColor: Colors.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  kpiCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: Colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.neutral.text,
    marginTop: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.muted,
    marginTop: 2,
  },
  listContainer: {
    padding: 14,
    paddingBottom: 24,
  },
  productCard: {
    backgroundColor: Colors.neutral.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    padding: 12,
    marginBottom: 12,
  },
  cardSoldOut: {
    opacity: 0.65,
    backgroundColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.neutral.background,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productMainDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeAvailable: {
    backgroundColor: '#dcfce7',
  },
  badgeSold: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  badgeTextAvailable: {
    color: Colors.feedback.success,
  },
  badgeTextSold: {
    color: Colors.feedback.alert,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.neutral.background,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: Colors.neutral.muted,
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
  pricingSummaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  recPriceText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.artisan.primary,
  },
  floorPriceText: {
    fontSize: 12,
    color: Colors.neutral.muted,
  },
  cardToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
    marginTop: 12,
    paddingTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.text,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
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