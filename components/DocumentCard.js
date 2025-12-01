import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

const getCategoryIcon = (category) => {
  const icons = {
    'lab-results': 'flask',
    'prescriptions': 'medical',
    'medical-reports': 'document-text',
    'insurance': 'card',
    'vaccination': 'shield-checkmark',
    'imaging': 'images',
    'other': 'folder',
  };
  return icons[category] || 'document';
};

const getCategoryColor = (category) => {
  const colors = {
    'lab-results': '#10b981',
    'prescriptions': '#ef4444',
    'medical-reports': '#3b82f6',
    'insurance': '#f59e0b',
    'vaccination': '#8b5cf6',
    'imaging': '#ec4899',
    'other': '#6b7280',
  };
  return colors[category] || '#6b7280';
};

const formatCategory = (category) => {
  return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

export default function DocumentCard({ document, onDelete }) {
  const category = document.category || 'other';
  const icon = getCategoryIcon(category);
  const color = getCategoryColor(category);

  const handleView = async () => {
    if (document.fileUrl) {
      const supported = await Linking.canOpenURL(document.fileUrl);
      if (supported) {
        await Linking.openURL(document.fileUrl);
      }
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={handleView}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle} numberOfLines={2}>
            {document.title}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={[styles.categoryText, { color }]}>
              {formatCategory(category)}
            </Text>
          </View>
          {document.description && (
            <Text style={styles.documentDescription} numberOfLines={1}>
              {document.description}
            </Text>
          )}
          <View style={styles.documentMeta}>
            <Text style={styles.metaText}>{formatDate(document.date || document.createdAt)}</Text>
            {document.fileSize && (
              <>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.metaText}>{formatFileSize(document.fileSize)}</Text>
              </>
            )}
          </View>
        </View>

        {onDelete && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onDelete(document)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  documentDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  metaDivider: {
    fontSize: 11,
    color: '#9ca3af',
    marginHorizontal: 6,
  },
  deleteButton: {
    padding: 8,
  },
});

