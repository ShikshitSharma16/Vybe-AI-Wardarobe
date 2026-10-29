import { File } from 'expo-file-system';
import { StyleSheet, Text, View, ScrollView, Pressable, Image, TextInput, Alert, } from 'react-native';
import {useEffect, useState} from 'react';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../config/api';

type ClothingItem = {
  _id?: string;
  name: string;
  category: string;
  color: string;
  imageUrl?: string;
  imageUri?: string;
};

type Outfit = {
  title: string;
  top: ClothingItem;
  bottom: ClothingItem;
  shoes: ClothingItem | null;
};

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clothingName, setClothingName] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loadingWardrobe, setLoadingWardrobe] = useState(false);
  const fetchWardrobe = async () => {
      try {
        setLoadingWardrobe(true);
        const response = await fetch(`${API_URL}/api/garments`);
        if (!response.ok) {
          throw new Error('Failed to load wardrobe');
        }
        const data = await response.json();
        setWardrobe(data.garments);
      } catch (error) {
        console.log('Wardrobe fetch error:', error);
        Alert.alert('Error', 'Could not load your wardrobe');
      } finally {setLoadingWardrobe(false);
      }
    };

const fetchOutfits = async () => {
  try {
    const response = await fetch(`${API_URL}/api/outfits/recommend`);

    if (!response.ok) {
      throw new Error('Failed to fetch outfits');
    }

    const data = await response.json();

    setOutfits(data.outfits);
  } catch (error) {
    console.log('Outfit fetch error:', error);
  }
};

useEffect(() => {
  fetchWardrobe();
  fetchOutfits();
}, []);

const deleteClothing = (id: string) => {
  Alert.alert(
    'Delete clothing item?',
    'This item will be permanently removed from your wardrobe.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${API_URL}/api/garments/${id}`,
              {
                method: 'DELETE',
              }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
              throw new Error(data.message || 'Delete failed');
            }

            await fetchWardrobe();

            Alert.alert('Deleted', 'Clothing item removed successfully!');
          } catch (error) {
            console.log('Delete clothing error:', error);
            Alert.alert('Error', 'Could not delete clothing item');
          }
        },
      },
    ]
  );
};

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const [savingClothing, setSavingClothing] = useState(false);

  const saveClothing = async () => {
    if (!selectedImage || !clothingName.trim() || !category.trim() || !color.trim()) {
      Alert.alert('Missing details', 'Please select a photo and fill in all fields.');
      return;
    }

    if (savingClothing) return;

    try {
      setSavingClothing(true);

    // Step 1: Prepare the image for upload
   const imageResponse = await fetch(selectedImage);
  // Read the selected image as a real file
const imageFile = new File(selectedImage);

// Prepare the image upload
const formData = new FormData();

// Add the actual image file to the request
formData.append('image', imageFile);

// Send the image to our Express backend
const uploadResponse = await fetch(`${API_URL}/api/upload`, {
  method: 'POST',
  body: formData,
});

    const uploadData = await uploadResponse.json();
    console.log('Upload status:', uploadResponse.status);
    console.log('Upload response:', uploadData);

    if (!uploadResponse.ok || !uploadData.success) {
  throw new Error(
    `Upload failed (${uploadResponse.status}): ${
      uploadData.message || 'No error details returned'
    }`
  );
}

    // Step 3: Save garment details in MongoDB
    const garmentResponse = await fetch(`${API_URL}/api/garments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: clothingName.trim(),
        category: category.trim(),
        color: color.trim(),
        imageUrl: uploadData.imageUrl,
      }),
    });

    const garmentData = await garmentResponse.json();

    if (!garmentResponse.ok || !garmentData.success) {
      throw new Error(garmentData.message || 'Failed to save garment');
    }

    // Step 4: Clear the form
    setSelectedImage(null);
    setClothingName('');
    setCategory('');
    setColor('');

    // Step 5: Reload garments from MongoDB
    await fetchWardrobe();

    Alert.alert('Success', 'Your clothing item was saved permanently!');
    } catch (error) {
      console.log('Save clothing error:', error);

      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Could not save clothing item'
      );
    } finally {
      setSavingClothing(false);
    }
};

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* App branding */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>VYBE</Text>
            <Text style={styles.tagline}>YOUR STYLE, INTELLIGENTLY.</Text>
          </View>

          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>V</Text>
          </View>
        </View>

        {/* Welcome section */}
        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>YOUR PERSONAL WARDROBE</Text>
          <Text style={styles.heading}>Dress well.</Text>
          <Text style={styles.headingAccent}>Feel confident.</Text>
          <Text style={styles.description}>
            Discover outfits, organise your clothes, and find your style.
          </Text>
        </View>

        {/* Main action */}
        <Pressable
          style={styles.primaryButton}
          onPress={openGallery}
        >
          <Text style={styles.primaryButtonText}>+  Add your clothes</Text>
        </Pressable>
        {selectedImage && (
          <View style={styles.imagePreviewCard}>
          <Text style={styles.imagePreviewTitle}>Add clothing details</Text>

          <Image
            source={{ uri: selectedImage }}
            style={styles.selectedImage}
            resizeMode="cover"
            />

          <TextInput
            style={styles.input}
            placeholder="Clothing name (e.g. Blue Shirt)"
            value={clothingName}
            onChangeText={setClothingName}
          />

          <TextInput
            style={styles.input}
            placeholder="Category (e.g. Shirt, Jeans, Shoes)"
            value={category}
            onChangeText={setCategory}
          />

          <TextInput
            style={styles.input}
            placeholder="Color (e.g. Blue)"
            value={color}
            onChangeText={setColor}
          />

          <Pressable
              style={styles.saveButton}
              onPress={saveClothing}
              disabled={savingClothing}
          >
          <Text style={styles.saveButtonText}>
          {savingClothing ? 'Saving...' : 'Save to Wardrobe'}
        </Text>
      </Pressable>
      </View>
        )}

        {/* Wardrobe summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your wardrobe</Text>
          <Text style={styles.mutedText}>YOUR COLLECTION</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Text style={styles.iconText}>✦</Text>
          </View>

          <Text style={styles.summaryNumber}>{wardrobe.length} items</Text>
          <Text style={styles.summaryDescription}>
            Your wardrobe starts here.
            {'\n'}Add your clothes to get started.
          </Text>
        </View>
        {wardrobe.map((item) => (
  <View key={item._id} style={styles.wardrobeItemCard}>
    <Image
      source={{ uri: item.imageUrl || item.imageUri }}
      style={styles.wardrobeItemImage}
    />

    <View style={styles.wardrobeItemDetails}>
      <Text style={styles.wardrobeItemName}>{item.name}</Text>
      <Text style={styles.wardrobeItemText}>Category: {item.category}</Text>
      <Text style={styles.wardrobeItemText}>Color: {item.color}</Text>
      {item._id && (
        <Pressable
          style={styles.deleteButton}
          onPress={() => deleteClothing(item._id!)}
        >
        <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      )}
    </View>
  </View>
))}


        {/* Outfit recommendations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Outfit inspiration</Text>
          <Text style={styles.mutedText}>FOR YOU</Text>
        </View>

        <View style={styles.recommendationCard}>
          <View style={styles.recommendationIcon}>
            <Text style={styles.outfitIcon}>◈</Text>
          </View>
          {outfits.map((outfit, index) => (
  <View key={index} style={styles.outfitCard}>
    <Text style={styles.outfitTitle}>
      Outfit {index + 1}: {outfit.title}
    </Text>

    <View style={styles.outfitImages}>
      <View style={styles.outfitPiece}>
        <Image
          source={{ uri: outfit.top.imageUrl }}
          style={styles.outfitImage}
        />
        <Text style={styles.outfitItemName}>
          {outfit.top.name}
        </Text>
      </View>

      <View style={styles.outfitPiece}>
        <Image
          source={{ uri: outfit.bottom.imageUrl }}
          style={styles.outfitImage}
        />
        <Text style={styles.outfitItemName}>
          {outfit.bottom.name}
        </Text>
      </View>

      {outfit.shoes && (
        <View style={styles.outfitPiece}>
          <Image
            source={{ uri: outfit.shoes.imageUrl }}
            style={styles.outfitImage}
          />
          <Text style={styles.outfitItemName}>
            {outfit.shoes.name}
          </Text>
        </View>
      )}
    </View>
  </View>
))}

          <Text style={styles.recommendationTitle}>
            Your next look starts here
          </Text>
          <Text style={styles.recommendationDescription}>
            Add a few clothing items and VYBE will help you explore
            outfit combinations.
          </Text>
        </View>

        {/* Future feature preview */}
        <View style={styles.note}>
          <Text style={styles.noteTitle}>STYLE THAT LEARNS WITH YOU</Text>
          <Text style={styles.noteText}>
            Personalised styling and smarter recommendations are part
            of the VYBE journey.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F2',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 58,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 42,
  },
  logo: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#24251F',
  },
  tagline: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#77796D',
    marginTop: 4,
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E4E7D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    color: '#38412D',
    fontSize: 18,
    fontWeight: '700',
  },
  welcome: {
    marginBottom: 25,
  },
  eyebrow: {
    color: '#747A55',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 15,
  },
  heading: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    color: '#25261F',
  },
  headingAccent: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    color: '#78815D',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#77786E',
    marginTop: 13,
    maxWidth: 290,
  },
  primaryButton: {
    backgroundColor: '#333C2B',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 34,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#282920',
  },
  mutedText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.3,
    color: '#898A7D',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 23,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#EBEAE3',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 25,
    color: '#68744D',
  },
  summaryNumber: {
    fontSize: 21,
    fontWeight: '700',
    color: '#292A23',
  },
  summaryDescription: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    color: '#818176',
    marginTop: 8,
  },
  recommendationCard: {
    backgroundColor: '#E9EBDD',
    borderRadius: 18,
    padding: 21,
    marginBottom: 25,
  },
  recommendationIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#D7DDC7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  outfitIcon: {
    fontSize: 24,
    color: '#48533A',
  },
  recommendationTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#303628',
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#626854',
  },
  note: {
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E3D9',
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#727951',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#77786E',
  },
  imagePreviewCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  padding: 18,
  marginBottom: 28,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#EBEAE3',
},
imagePreviewTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#282920',
  marginBottom: 15,
},
selectedImage: {
  width: 220,
  height: 260,
  borderRadius: 12,
},
imagePreviewNote: {
  fontSize: 13,
  color: '#68744D',
  marginTop: 12,
},
input: {
  width: '100%',
  borderWidth: 1,
  borderColor: '#DDDFD4',
  borderRadius: 10,
  padding: 13,
  marginTop: 12,
  fontSize: 14,
  color: '#282920',
  backgroundColor: '#FFFFFF',
},
saveButton: {
  backgroundColor: '#333C2B',
  borderRadius: 12,
  paddingVertical: 15,
  paddingHorizontal: 25,
  marginTop: 18,
  width: '100%',
  alignItems: 'center',
},
saveButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '600',
},
wardrobeItemCard: {
  flexDirection: 'row',
  backgroundColor: '#FFFFFF',
  borderRadius: 15,
  padding: 12,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#EBEAE3',
},
wardrobeItemImage: {
  width: 90,
  height: 100,
  borderRadius: 10,
},
wardrobeItemDetails: {
  flex: 1,
  paddingLeft: 15,
  justifyContent: 'center',
},
wardrobeItemName: {
  fontSize: 16,
  fontWeight: '700',
  color: '#282920',
  marginBottom: 7,
},
wardrobeItemText: {
  fontSize: 13,
  color: '#77786E',
  marginBottom: 4,
},
deleteButton: {
  marginTop: 10,
  paddingVertical: 8,
  paddingHorizontal: 12,
  backgroundColor: '#FCE8E6',
  borderRadius: 8,
  alignSelf: 'flex-start',
},

deleteButtonText: {
  color: '#B42318',
  fontSize: 13,
  fontWeight: '600',
},

outfitCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 18,
  padding: 16,
  marginBottom: 15,
  borderWidth: 1,
  borderColor: '#EBEAE3',
},

outfitTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#282920',
  marginBottom: 14,
},

outfitImages: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},

outfitPiece: {
  width: '31%',
  alignItems: 'center',
},

outfitImage: {
  width: '100%',
  height: 110,
  borderRadius: 10,
  backgroundColor: '#EEF0E6',
},

outfitItemName: {
  fontSize: 12,
  color: '#555A4A',
  textAlign: 'center',
  marginTop: 8,
},

});
