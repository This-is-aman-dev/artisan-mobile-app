import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Mic,
  Square,
  Sparkles,
  IndianRupee,
  Clock,
  Check,
  RefreshCw,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  ChevronDown,
  X,
  Plus,
} from 'lucide-react-native';
import api from '../../api/client';
import { Colors } from '../../constants/theme';
import { ProcessVoiceResponse, PricingBreakdown, SellerPriceValidation } from '../../types';

interface BenchmarkItem {
  productName: string;
  material: string;
  rawMaterialCost: number;
  laborHours: number;
  minRawCost?: number;
  maxRawCost?: number;
  minHours?: number;
  maxHours?: number;
}

interface CategoryDataset {
  items: BenchmarkItem[];
  materials: string[];
}

export const CreateProductScreen = ({ navigation }: any) => {
  // Dynamic Dataset States loaded from Backend
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [datasetMap, setDatasetMap] = useState<Record<string, CategoryDataset>>({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Form Fields & Selections
  const [category, setCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [productItem, setProductItem] = useState<string>('');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductInput, setCustomProductInput] = useState('');

  // MULTI-SELECT MATERIAL STATE
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [customMaterialInput, setCustomMaterialInput] = useState('');
  const [showAddCustomMaterialInput, setShowAddCustomMaterialInput] = useState(false);

  // Media & Numeric Cost inputs
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [rawCost, setRawCost] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');

  // Dropdown Modals Visibility
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  // Audio, AI & Process states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiData, setAiData] = useState<ProcessVoiceResponse | null>(null);

  // Editable output metadata
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);

  // Seller validation
  const [desiredPrice, setDesiredPrice] = useState<string>('');
  const [priceValidation, setPriceValidation] = useState<SellerPriceValidation | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Load dataset options from MongoDB on initial mount
  useEffect(() => {
    fetchDatasetOptions();
  }, []);

  const fetchDatasetOptions = async () => {
    try {
      setIsLoadingOptions(true);
      const res = await api.get<{ categories: string[]; data: Record<string, CategoryDataset> }>(
        '/products/dataset-options'
      );
      setCategoriesList(res.data.categories || []);
      setDatasetMap(res.data.data || {});

      // Set initial defaults from dataset if available
      if (res.data.categories && res.data.categories.length > 0) {
        const firstCategory = res.data.categories[0];
        setCategory(firstCategory);

        const categoryData = res.data.data[firstCategory];
        if (categoryData?.items && categoryData.items.length > 0) {
          const firstItem = categoryData.items[0];
          setProductItem(firstItem.productName);

          // Parse initial materials array
          const initialMats = (firstItem.material || '')
            .split(/[,/]+/)
            .map((m) => m.trim())
            .filter(Boolean);
          setSelectedMaterials(initialMats.length ? initialMats : ['Handcrafted Material']);

          setRawCost(String(firstItem.rawMaterialCost));
          setHours(String(firstItem.laborHours));
          setNotes(`Authentic ${firstItem.productName} handcrafted with traditional techniques.`);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch dataset options:', err.message);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Category select handler
  const handleSelectCategory = (selectedCat: string) => {
    if (selectedCat.includes('Other')) {
      setIsCustomCategory(true);
      setCategory('');
      setProductItem('');
      setIsCustomProduct(true);
      setSelectedMaterials([]);
    } else {
      setIsCustomCategory(false);
      setCategory(selectedCat);

      const catData = datasetMap[selectedCat];
      if (catData?.items && catData.items.length > 0) {
        const firstItem = catData.items[0];
        setProductItem(firstItem.productName);
        setIsCustomProduct(false);

        const parsedMats = (firstItem.material || '')
          .split(/[,/]+/)
          .map((m) => m.trim())
          .filter(Boolean);
        setSelectedMaterials(parsedMats);

        setRawCost(String(firstItem.rawMaterialCost));
        setHours(String(firstItem.laborHours));
        setNotes(`Authentic ${firstItem.productName} handcrafted with traditional techniques.`);
      } else {
        setProductItem('');
        setSelectedMaterials([]);
      }
    }
    setShowCategoryModal(false);
  };

  // Product item select handler
  const handleSelectProductItem = (itemObj: BenchmarkItem | string) => {
    if (typeof itemObj === 'string' && itemObj.includes('Other')) {
      setIsCustomProduct(true);
      setProductItem('');
    } else if (typeof itemObj !== 'string') {
      setIsCustomProduct(false);
      setProductItem(itemObj.productName);

      const parsedMats = (itemObj.material || '')
        .split(/[,/]+/)
        .map((m) => m.trim())
        .filter(Boolean);
      setSelectedMaterials(parsedMats);

      setRawCost(String(itemObj.rawMaterialCost));
      setHours(String(itemObj.laborHours));
      setNotes(`Authentic ${itemObj.productName} handcrafted using ${itemObj.material}.`);
    }
    setShowProductModal(false);
  };

  // Multi-select toggle for materials
  const toggleMaterialSelection = (mat: string) => {
    if (selectedMaterials.includes(mat)) {
      setSelectedMaterials(selectedMaterials.filter((m) => m !== mat));
    } else {
      setSelectedMaterials([...selectedMaterials, mat]);
    }
  };

  // Remove individual material chip
  const removeMaterialChip = (mat: string) => {
    setSelectedMaterials(selectedMaterials.filter((m) => m !== mat));
  };

  // Add custom material to selection
  const handleAddCustomMaterial = () => {
    const trimmed = customMaterialInput.trim();
    if (!trimmed) return;
    if (!selectedMaterials.includes(trimmed)) {
      setSelectedMaterials([...selectedMaterials, trimmed]);
    }
    setCustomMaterialInput('');
    setShowAddCustomMaterialInput(false);
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Denied', 'Camera access is required to photograph your craft.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick or capture image.');
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setVoiceRecorded(true);
        if (!notes) {
          setNotes(`Authentic ${productItem || 'handmade item'} with natural finish.`);
        }
      }, 3000);
    } else {
      setIsRecording(false);
      setVoiceRecorded(true);
    }
  };

  const uploadImageToServer = async (uri: string): Promise<string> => {
    const filename = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);

    const res = await api.post<{ imageUrl: string }>('/products/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.imageUrl;
  };

  const handleProcessAi = async () => {
    const finalCategory = isCustomCategory ? customCategoryInput.trim() : category;
    const finalProduct = isCustomProduct ? customProductInput.trim() : productItem;
    const combinedMaterials = selectedMaterials.join(', ') || 'Handcrafted Material';

    if (!notes && !rawCost) {
      Alert.alert('Details Missing', 'Please enter craft notes or raw cost and labor hours.');
      return;
    }

    if (selectedMaterials.length === 0) {
      Alert.alert('Material Missing', 'Please select at least one raw material.');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      if (rawCost) formData.append('manualRawCost', rawCost);
      if (hours) formData.append('manualHours', hours);
      if (notes) formData.append('manualNotes', `${finalProduct ? `${finalProduct}. ` : ''}${notes}`);
      if (finalCategory) formData.append('category', finalCategory);
      formData.append('material', combinedMaterials);

      const res = await api.post<ProcessVoiceResponse>('/products/process-voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;
      setAiData(data);
      setTitleEn(data.titleEn || finalProduct || 'Handcrafted Artisan Craft');
      setTitleHi(data.titleHi || '');
      setDescriptionEn(data.descriptionEn || '');
      setPricing(data.pricing);

      const rec = String(data.pricing.recommendedPrice);
      setDesiredPrice(rec);
      validatePrice(rec, data.pricing);

      if (data.genuineness && data.genuineness.categoryFound && !data.genuineness.isGenuine) {
        Alert.alert(
          '⚠️ Craft Data Verification Notice',
          data.genuineness.warnings.join('\n\n') +
            `\n\nTypical benchmark standards for "${data.genuineness.matchedBenchmark}":\n` +
            `• Cost: ${data.genuineness.expectedBounds?.costRange}\n` +
            `• Labor: ${data.genuineness.expectedBounds?.hoursRange}\n` +
            `• Materials: ${data.genuineness.expectedBounds?.expectedMaterials}\n\n` +
            'Please verify if your raw costs, labor hours, and materials are accurate.',
          [{ text: 'Review Data' }]
        );
      }
    } catch (err: any) {
      Alert.alert('Processing Error', err.response?.data?.message || 'Failed to process craft details with AI.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validatePrice = (priceStr: string, activePricing = pricing) => {
    if (!activePricing) return;
    const priceNum = Number(priceStr);
    if (!priceNum || isNaN(priceNum)) {
      setPriceValidation(null);
      return;
    }

    const { floorPrice, recommendedPrice, exhibitionPrice } = activePricing;

    if (priceNum < floorPrice) {
      const diff = Math.round(((floorPrice - priceNum) / floorPrice) * 100);
      setPriceValidation({
        status: 'UNDERPRICED',
        diffPercent: diff,
        message: `Your price is ${diff}% below the sustainable floor price (₹${floorPrice}). You are underpaying your own labor.`,
        suggested: recommendedPrice,
        floorPrice,
      });
    } else if (priceNum > exhibitionPrice) {
      const diff = Math.round(((priceNum - exhibitionPrice) / exhibitionPrice) * 100);
      setPriceValidation({
        status: 'OVERPRICED',
        diffPercent: diff,
        message: `Your price is ${diff}% above the calculated exhibition range (₹${exhibitionPrice}). It might sell more slowly.`,
        suggested: recommendedPrice,
        exhibitionPrice,
      });
    } else {
      setPriceValidation({
        status: 'WITHIN_RANGE',
        diffPercent: 0,
        message: `Fair trade verified! Your price is balanced within the sustainable range (₹${floorPrice} - ₹${exhibitionPrice}).`,
        suggested: priceNum,
      });
    }
  };

  const initiatePublish = () => {
    if (!titleEn || !pricing) {
      Alert.alert('Incomplete', 'Please run the benchmark calculation first.');
      return;
    }

    const finalNum = Number(desiredPrice);
    if (!finalNum || finalNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter your desired listing price.');
      return;
    }

    if (priceValidation && priceValidation.status !== 'WITHIN_RANGE') {
      setShowWarningModal(true);
      return;
    }

    executeSaveProduct();
  };

  const executeSaveProduct = async () => {
    setShowWarningModal(false);
    setIsSaving(true);

    const finalCategory = isCustomCategory ? customCategoryInput.trim() : category;
    const combinedMaterials = selectedMaterials.join(', ') || 'Handcrafted Material';

    try {
      let finalImageUrl = '';
      if (imageUri) {
        finalImageUrl = await uploadImageToServer(imageUri);
      }

      await api.post('/products/save', {
        titleEn,
        titleHi,
        category: finalCategory,
        material: combinedMaterials,
        descriptionEn,
        descriptionHi: aiData?.descriptionHi || '',
        imageUrl: finalImageUrl,
        rawCost: Number(rawCost) || aiData?.rawCost || 0,
        hours: Number(hours) || aiData?.hours || 0,
        pricing,
        sellerPrice: Number(desiredPrice) || pricing?.recommendedPrice,
      });

      Alert.alert('Listing Published! 🎉', 'Your craft has been added to inventory and verified by the system.', [
        {
          text: 'Go to Stock',
          onPress: () => {
            setImageUri(null);
            setVoiceRecorded(false);
            setRawCost('');
            setHours('');
            setNotes('');
            setAiData(null);
            setPricing(null);
            setDesiredPrice('');
            setPriceValidation(null);
            setSelectedMaterials([]);
            navigation.navigate('Inventory');
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || 'Could not save product to inventory.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentCategoryData = datasetMap[category];
  const availableItemsList = currentCategoryData?.items || [];
  const availableMaterialsList = currentCategoryData?.materials || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* 1. Media Capture Section */}
      <Text style={styles.sectionHeader}>1. Craft Photo / शिल्प की फोटो</Text>
      <View style={styles.imageCard}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.repickBtn}
              onPress={() => pickImage(true)}
              activeOpacity={0.8}
            >
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.repickText}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mediaButtonsRow}>
            <TouchableOpacity
              style={[styles.mediaActionBtn, { borderColor: Colors.artisan.primary }]}
              onPress={() => pickImage(true)}
              activeOpacity={0.8}
            >
              <Camera size={26} color={Colors.artisan.primary} />
              <Text style={[styles.mediaBtnText, { color: Colors.artisan.primary }]}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaActionBtn}
              onPress={() => pickImage(false)}
              activeOpacity={0.8}
            >
              <ImageIcon size={26} color={Colors.neutral.muted} />
              <Text style={styles.mediaBtnText}>From Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* 2. Three Dynamic Dropdowns: Category, Item & Multi-Select Materials */}
      <Text style={styles.sectionHeader}>2. Dataset Category, Product & Materials</Text>
      <View style={styles.card}>
        {isLoadingOptions ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.artisan.primary} />
            <Text style={{ fontSize: 12, color: Colors.neutral.muted, marginTop: 6 }}>
              Loading dataset benchmarks...
            </Text>
          </View>
        ) : (
          <>
            {/* Dropdown 1: Category */}
            <Text style={styles.inputLabel}>Craft Category (Dataset)</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownTriggerText}>
                {isCustomCategory
                  ? `Custom: ${customCategoryInput || 'Tap to enter custom category'}`
                  : category || 'Select Category'}
              </Text>
              <ChevronDown size={18} color={Colors.neutral.muted} />
            </TouchableOpacity>

            {isCustomCategory && (
              <TextInput
                style={[styles.textInput, { marginTop: 8 }]}
                placeholder="Type new category name..."
                value={customCategoryInput}
                onChangeText={setCustomCategoryInput}
              />
            )}

            {/* Dropdown 2: Product / Item Name */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Product / Item Name (Dataset)</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setShowProductModal(true)}
              activeOpacity={0.8}
              disabled={isCustomCategory}
            >
              <Text style={styles.dropdownTriggerText}>
                {isCustomProduct
                  ? `Custom: ${customProductInput || 'Tap to enter custom item'}`
                  : productItem || 'Select Product/Item Name'}
              </Text>
              <ChevronDown size={18} color={Colors.neutral.muted} />
            </TouchableOpacity>

            {isCustomProduct && (
              <TextInput
                style={[styles.textInput, { marginTop: 8 }]}
                placeholder="Type new craft/item name..."
                value={customProductInput}
                onChangeText={setCustomProductInput}
              />
            )}

            {/* Multi-Select Raw Materials Selector */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 6 }}>
              <Text style={[styles.inputLabel, { marginBottom: 0 }]}>
                Materials Used ({selectedMaterials.length})
              </Text>
              <Text style={{ fontSize: 11, color: Colors.artisan.primary, fontWeight: '600' }}>
                Tap below to add/remove
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setShowMaterialModal(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownTriggerText, selectedMaterials.length === 0 && { color: Colors.neutral.muted }]}>
                {selectedMaterials.length > 0
                  ? `${selectedMaterials.length} material(s) chosen`
                  : 'Select one or more materials...'}
              </Text>
              <ChevronDown size={18} color={Colors.neutral.muted} />
            </TouchableOpacity>

            {/* Selected Materials Chips display */}
            {selectedMaterials.length > 0 && (
              <View style={styles.chipsContainer}>
                {selectedMaterials.map((mat, index) => (
                  <View key={index} style={styles.materialChip}>
                    <Text style={styles.materialChipText}>{mat}</Text>
                    <TouchableOpacity
                      onPress={() => removeMaterialChip(mat)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={14} color={Colors.artisan.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* 3. Costing & Craft Voice Notes */}
      <Text style={styles.sectionHeader}>3. Costing & Craft Voice Notes / लागत और विवरण</Text>
      <View style={styles.card}>
        <View style={styles.voiceSection}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && { backgroundColor: Colors.feedback.alert },
            ]}
            onPress={toggleRecording}
            activeOpacity={0.85}
          >
            {isRecording ? <Square size={24} color="#fff" /> : <Mic size={24} color="#fff" />}
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Listening (3s)...' : voiceRecorded ? 'Record Again' : 'Speak Craft Story'}
            </Text>
          </TouchableOpacity>
          {voiceRecorded && (
            <Text style={styles.audioRecordedLabel}>✓ Voice details captured</Text>
          )}
        </View>

        <View style={styles.costingRow}>
          <View style={styles.costInputGroup}>
            <Text style={styles.inputLabel}>Raw Material (₹)</Text>
            <View style={styles.inputIconWrapper}>
              <IndianRupee size={16} color={Colors.neutral.muted} />
              <TextInput
                style={styles.costInput}
                placeholder="180"
                keyboardType="numeric"
                value={rawCost}
                onChangeText={setRawCost}
              />
            </View>
          </View>

          <View style={styles.costInputGroup}>
            <Text style={styles.inputLabel}>Labor (Hours)</Text>
            <View style={styles.inputIconWrapper}>
              <Clock size={16} color={Colors.neutral.muted} />
              <TextInput
                style={styles.costInput}
                placeholder="4"
                keyboardType="numeric"
                value={hours}
                onChangeText={setHours}
              />
            </View>
          </View>
        </View>

        <View style={styles.manualNotesGroup}>
          <Text style={styles.inputLabel}>Craft Notes & Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. Handcrafted floral vase with traditional motifs..."
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity
          style={styles.processAiButton}
          onPress={handleProcessAi}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Sparkles size={18} color="#fff" />
              <Text style={styles.processAiButtonText}>Run Benchmark & Fair Price Algorithm</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 4. Genuineness Verification Audit Badge */}
      {aiData?.genuineness && (
        <View
          style={[
            styles.card,
            aiData.genuineness.isGenuine
              ? { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }
              : { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {aiData.genuineness.isGenuine ? (
              <ShieldCheck size={20} color={Colors.feedback.success} />
            ) : (
              <AlertTriangle size={20} color={Colors.feedback.alert} />
            )}
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: aiData.genuineness.isGenuine ? Colors.feedback.success : Colors.feedback.alert,
              }}
            >
              {aiData.genuineness.categoryFound
                ? aiData.genuineness.isGenuine
                  ? 'Dataset Verified: Genuine Craft Data'
                  : 'Data Inconsistency Detected'
                : 'Unexplored Category Discovered'}
            </Text>
          </View>

          {aiData.genuineness.categoryFound ? (
            aiData.genuineness.isGenuine ? (
              <Text style={{ fontSize: 12, color: Colors.neutral.text }}>
                Raw material costs, multi-material composition, and labor match verified standards for{' '}
                <Text style={{ fontWeight: '700' }}>{aiData.genuineness.matchedBenchmark}</Text>.
              </Text>
            ) : (
              <View>
                {aiData.genuineness.warnings.map((warn: string, idx: number) => (
                  <Text key={idx} style={{ fontSize: 12, color: Colors.feedback.alert, marginTop: 3 }}>
                    • {warn}
                  </Text>
                ))}
                <Text style={{ fontSize: 11, color: Colors.neutral.muted, marginTop: 6 }}>
                  Benchmark bounds (±20% margin): Cost {aiData.genuineness.expectedBounds?.costRange} | Hours{' '}
                  {aiData.genuineness.expectedBounds?.hoursRange}
                </Text>
              </View>
            )
          ) : (
            <Text style={{ fontSize: 12, color: Colors.neutral.text }}>
              This craft belongs to a new category. It will be added to the self-learning dataset and exported for verification.
            </Text>
          )}
        </View>
      )}

      {/* 5. 3-Tier Fair Pricing Breakdown Card */}
      {pricing && (
        <>
          <Text style={styles.sectionHeader}>4. Algorithm Fair Price Range (3 Tiers)</Text>
          <View style={styles.pricingCard}>
            <Text style={styles.pricingSubheader}>
              Calculated from Material + Skilled Wage (₹{aiData?.hourlyRate || 85}/hr) + Packaging
            </Text>

            <View style={styles.tiersContainer}>
              <View style={[styles.tierColumn, { borderColor: Colors.feedback.alert }]}>
                <Text style={[styles.tierBadge, { backgroundColor: '#fee2e2', color: Colors.feedback.alert }]}>
                  Floor Minimum
                </Text>
                <Text style={styles.tierValue}>₹{pricing.floorPrice}</Text>
                <Text style={styles.tierDescription}>Break-even floor (+10% margin)</Text>
              </View>

              <View
                style={[
                  styles.tierColumn,
                  styles.recommendedColumn,
                  { borderColor: Colors.artisan.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tierBadge,
                    { backgroundColor: Colors.artisan.light, color: Colors.artisan.primary },
                  ]}
                >
                  Fair Market
                </Text>
                <Text style={[styles.tierValue, { color: Colors.artisan.primary }]}>
                  ₹{pricing.recommendedPrice}
                </Text>
                <Text style={styles.tierDescription}>Dataset benchmark + fair living wage</Text>
              </View>

              <View style={[styles.tierColumn, { borderColor: Colors.feedback.warning }]}>
                <Text style={[styles.tierBadge, { backgroundColor: '#fef3c7', color: Colors.feedback.warning }]}>
                  Premium
                </Text>
                <Text style={styles.tierValue}>₹{pricing.exhibitionPrice}</Text>
                <Text style={styles.tierDescription}>Exhibition & gallery tier (+25%)</Text>
              </View>
            </View>
          </View>

          {/* 6. Desired Listing Price */}
          <Text style={styles.sectionHeader}>5. Seller Desired Price / आपका तय मूल्य</Text>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Set Your Listing Price (₹)</Text>
            <View style={styles.desiredPriceWrapper}>
              <IndianRupee size={22} color={Colors.artisan.primary} />
              <TextInput
                style={styles.desiredPriceInput}
                keyboardType="numeric"
                value={desiredPrice}
                onChangeText={(val) => {
                  setDesiredPrice(val);
                  validatePrice(val);
                }}
              />
            </View>

            {priceValidation && (
              <View
                style={[
                  styles.validationCard,
                  priceValidation.status === 'WITHIN_RANGE' && styles.valSuccess,
                  priceValidation.status === 'UNDERPRICED' && styles.valAlert,
                  priceValidation.status === 'OVERPRICED' && styles.valWarning,
                ]}
              >
                <View style={styles.valHeader}>
                  {priceValidation.status === 'WITHIN_RANGE' ? (
                    <CheckCircle2 size={18} color={Colors.feedback.success} />
                  ) : (
                    <AlertTriangle
                      size={18}
                      color={
                        priceValidation.status === 'UNDERPRICED'
                          ? Colors.feedback.alert
                          : Colors.feedback.warning
                      }
                    />
                  )}
                  <Text
                    style={[
                      styles.valTitle,
                      priceValidation.status === 'WITHIN_RANGE' && { color: Colors.feedback.success },
                      priceValidation.status === 'UNDERPRICED' && { color: Colors.feedback.alert },
                      priceValidation.status === 'OVERPRICED' && { color: Colors.feedback.warning },
                    ]}
                  >
                    {priceValidation.status === 'WITHIN_RANGE'
                      ? 'Price Within Fair Range'
                      : priceValidation.status === 'UNDERPRICED'
                      ? `Underpriced (${priceValidation.diffPercent}% Below Floor)`
                      : `Overpriced (${priceValidation.diffPercent}% Above Benchmark)`}
                  </Text>
                </View>
                <Text style={styles.valMessage}>{priceValidation.message}</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* 7. Generated Listing Details & Publish Trigger */}
      {aiData && (
        <>
          <Text style={styles.sectionHeader}>6. Listing Details</Text>
          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Product Title (English)</Text>
              <TextInput style={styles.textInput} value={titleEn} onChangeText={setTitleEn} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>शीर्षक (Hindi)</Text>
              <TextInput style={styles.textInput} value={titleHi} onChangeText={setTitleHi} />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={initiatePublish}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Confirm & Publish Listing</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* MODAL 1: CATEGORY SELECTION */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Craft Category ({categoriesList.length})</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={22} color={Colors.neutral.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[...categoriesList, 'Other / Custom Category']}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    (category === item && !isCustomCategory) && styles.pickerOptionActive,
                  ]}
                  onPress={() => handleSelectCategory(item)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      (category === item && !isCustomCategory) && styles.pickerOptionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {(category === item && !isCustomCategory) && (
                    <Check size={18} color={Colors.artisan.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 2: PRODUCT / ITEM NAME SELECTION */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>
                {category} Crafts ({availableItemsList.length})
              </Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <X size={22} color={Colors.neutral.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[...availableItemsList, { productName: 'Other / Custom Craft Item' } as BenchmarkItem]}
              keyExtractor={(item) => item.productName}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    (productItem === item.productName && !isCustomProduct) && styles.pickerOptionActive,
                  ]}
                  onPress={() => handleSelectProductItem(item)}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text
                      style={[
                        styles.pickerOptionText,
                        (productItem === item.productName && !isCustomProduct) && styles.pickerOptionTextActive,
                      ]}
                    >
                      {item.productName}
                    </Text>
                    {item.rawMaterialCost > 0 && (
                      <Text style={{ fontSize: 11, color: Colors.neutral.muted, marginTop: 2 }}>
                        Typical: ~₹{item.rawMaterialCost} materials • ~{item.laborHours} hrs
                      </Text>
                    )}
                  </View>
                  {(productItem === item.productName && !isCustomProduct) && (
                    <Check size={18} color={Colors.artisan.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 3: MULTI-SELECT RAW MATERIALS SELECTION */}
      <Modal visible={showMaterialModal} transparent animationType="slide">
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerModalHeader}>
              <View>
                <Text style={styles.pickerModalTitle}>Select Raw Materials</Text>
                <Text style={{ fontSize: 12, color: Colors.neutral.muted, marginTop: 2 }}>
                  {selectedMaterials.length} selected
                </Text>
              </View>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setShowMaterialModal(false)}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Material Input Toggle */}
            <View style={{ marginBottom: 12 }}>
              {showAddCustomMaterialInput ? (
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Enter custom material..."
                    value={customMaterialInput}
                    onChangeText={setCustomMaterialInput}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.addCustomChipBtn}
                    onPress={handleAddCustomMaterial}
                  >
                    <Plus size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowAddCustomMaterialInput(false)}
                  >
                    <X size={20} color={Colors.neutral.muted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addCustomTriggerBtn}
                  onPress={() => setShowAddCustomMaterialInput(true)}
                >
                  <Plus size={16} color={Colors.artisan.primary} />
                  <Text style={styles.addCustomTriggerText}>Add Custom / Unlisted Material</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={availableMaterialsList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selectedMaterials.includes(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerOption,
                      isSelected && styles.pickerOptionActive,
                    ]}
                    onPress={() => toggleMaterialSelection(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        isSelected && styles.pickerOptionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    <View
                      style={[
                        styles.checkboxSquare,
                        isSelected && styles.checkboxSquareActive,
                      ]}
                    >
                      {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* FLOWCHART WARNING MODAL */}
      <Modal
        visible={showWarningModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWarningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalCard}>
            <View style={styles.modalIconWrapper}>
              <AlertTriangle
                size={36}
                color={
                  priceValidation?.status === 'UNDERPRICED'
                    ? Colors.feedback.alert
                    : Colors.feedback.warning
                }
              />
            </View>

            <Text style={styles.modalHeading}>
              {priceValidation?.status === 'UNDERPRICED' ? 'Price Below Sustainable Floor' : 'Price Above Market Range'}
            </Text>

            <Text style={styles.modalBodyText}>{priceValidation?.message}</Text>

            <View style={styles.modalPricingComparison}>
              <Text style={styles.modalCompText}>
                Your Choice: <Text style={{ fontWeight: '800' }}>₹{desiredPrice}</Text>
              </Text>
              <Text style={styles.modalCompText}>
                Recommended: <Text style={{ fontWeight: '800', color: Colors.artisan.primary }}>₹{pricing?.recommendedPrice}</Text>
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.adjustPriceButton}
                onPress={() => setShowWarningModal(false)}
              >
                <Sliders size={16} color={Colors.artisan.primary} />
                <Text style={styles.adjustButtonText}>Adjust Price (Keep Editing)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmAnywayButton}
                onPress={executeSaveProduct}
              >
                <Text style={styles.confirmAnywayText}>Confirm Price & Publish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.text,
    marginTop: 14,
    marginBottom: 8,
  },
  imageCard: {
    backgroundColor: Colors.neutral.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  repickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    position: 'absolute',
    bottom: 12,
    right: 12,
    gap: 6,
  },
  repickText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  mediaActionBtn: {
    flex: 1,
    paddingVertical: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.neutral.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mediaBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.muted,
  },
  card: {
    backgroundColor: Colors.neutral.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.text,
    marginBottom: 6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.neutral.background,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: Colors.neutral.text,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  materialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  materialChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.artisan.primary,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxSquareActive: {
    backgroundColor: Colors.artisan.primary,
    borderColor: Colors.artisan.primary,
  },
  doneBtn: {
    backgroundColor: Colors.artisan.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  addCustomTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.artisan.light,
    alignSelf: 'flex-start',
  },
  addCustomTriggerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.artisan.primary,
  },
  addCustomChipBtn: {
    backgroundColor: Colors.artisan.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.artisan.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  audioRecordedLabel: {
    fontSize: 12,
    color: Colors.feedback.success,
    fontWeight: '600',
    marginTop: 6,
  },
  costingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  costInputGroup: {
    flex: 1,
  },
  inputIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.neutral.background,
  },
  costInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 15,
    color: Colors.neutral.text,
  },
  manualNotesGroup: {
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: Colors.neutral.background,
    fontSize: 14,
    color: Colors.neutral.text,
    textAlignVertical: 'top',
  },
  processAiButton: {
    flexDirection: 'row',
    backgroundColor: Colors.artisan.primary,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  processAiButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  pricingCard: {
    backgroundColor: Colors.neutral.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    marginBottom: 10,
  },
  pricingSubheader: {
    fontSize: 12,
    color: Colors.neutral.muted,
    marginBottom: 12,
  },
  tiersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tierColumn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 10,
    alignItems: 'center',
  },
  recommendedColumn: {
    backgroundColor: '#fff7ed',
  },
  tierBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
  tierValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.neutral.text,
    marginBottom: 4,
  },
  tierDescription: {
    fontSize: 9,
    color: Colors.neutral.muted,
    textAlign: 'center',
  },
  desiredPriceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.artisan.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  desiredPriceInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.neutral.text,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  validationCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  valSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  valAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  valWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  valHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  valTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  valMessage: {
    fontSize: 12,
    color: Colors.neutral.text,
    lineHeight: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.neutral.background,
    fontSize: 14,
    color: Colors.neutral.text,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.feedback.success,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.text,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
  },
  pickerOptionActive: {
    backgroundColor: Colors.artisan.light,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.neutral.text,
  },
  pickerOptionTextActive: {
    fontWeight: '700',
    color: Colors.artisan.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  warningModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  modalIconWrapper: {
    marginBottom: 12,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.neutral.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBodyText: {
    fontSize: 13,
    color: Colors.neutral.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalPricingComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: Colors.neutral.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalCompText: {
    fontSize: 13,
    color: Colors.neutral.text,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  adjustPriceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.artisan.primary,
    backgroundColor: Colors.artisan.light,
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.artisan.primary,
  },
  confirmAnywayButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  confirmAnywayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});