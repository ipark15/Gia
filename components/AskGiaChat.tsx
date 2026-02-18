import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function generateAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('irritation') || q.includes('normal')) {
    return "Some irritation can be normal when starting new products, especially actives. If it persists beyond 2 weeks, becomes painful, or worsens, consider pausing the product and consulting your dermatologist.";
  }
  if (q.includes('redness') || q.includes('red')) {
    return "Redness can be managed with gentle, fragrance-free products. Look for ingredients like centella asiatica, niacinamide, or azelaic acid. Avoid hot water and harsh exfoliants.";
  }
  if (q.includes('stop') || q.includes('discontinue')) {
    return "Stop a product if you experience severe burning, blistering, significant swelling, or an allergic reaction. Mild tingling from actives like retinol is normal, but pain is not.";
  }
  if (q.includes('retinol') || q.includes('tretinoin')) {
    return "Start retinoids slowly — 2-3 times per week, gradually increasing. Use a pea-sized amount for whole face. Buffer with moisturizer if needed.";
  }
  if (q.includes('purge') || q.includes('purging')) {
    return "Purging typically happens with actives like retinoids or acids. It should only occur in areas where you normally break out and resolve within 4-6 weeks.";
  }
  return "That's a great question. Based on AAD guidelines, I'd recommend discussing this with your dermatologist for personalized advice. In the meantime, stick to gentle, fragrance-free products.";
}

export interface AskGiaChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: string;
  routineType: 'morning' | 'evening';
}

export function AskGiaChat({ isOpen, onClose, currentStep, routineType }: AskGiaChatProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  const handleAsk = () => {
    if (!question.trim()) return;
    setAnswer(generateAnswer(question));
  };

  const handleClose = () => {
    setQuestion('');
    setAnswer(null);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>ask gia</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={24} color="#6B7370" />
            </TouchableOpacity>
          </View>

          <Text style={styles.context}>
            {routineType === 'evening' ? 'Evening' : 'Morning'} routine · {currentStep}
          </Text>

          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask a question about this step or your skin..."
            placeholderTextColor="#8A9088"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.askButton} onPress={handleAsk} activeOpacity={0.9}>
            <Text style={styles.askButtonText}>ask</Text>
          </TouchableOpacity>

          {answer !== null && (
            <View style={styles.answerBox}>
              <Text style={styles.answerLabel}>gia</Text>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          )}

          <Text style={styles.hint}>Get guidance, check in, or add photos during your routine.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5A7A6B',
    fontStyle: 'italic',
  },
  closeBtn: {
    padding: 4,
  },
  context: {
    fontSize: 13,
    color: '#6B7370',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D5CF',
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    color: '#2D4A3E',
    minHeight: 80,
    marginBottom: 12,
  },
  askButton: {
    backgroundColor: '#5F8575',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  askButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  answerBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(123,155,140,0.2)',
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B9B8C',
    marginBottom: 6,
  },
  answerText: {
    fontSize: 14,
    color: '#2D4A3E',
    lineHeight: 22,
  },
  hint: {
    fontSize: 12,
    color: '#6B8B7D',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
