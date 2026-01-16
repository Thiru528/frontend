import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomToast from '../../components/CustomToast';

const PremiumScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const plans = [
    { id: 'monthly', title: 'Monthly Starter', price: '₹99' },
    { id: 'yearly', title: 'Annual Pro', price: '₹299', best: true },
  ];

  const features = [
    'Resume AI Analysis (Detailed)',
    'Personalized AI Tips',
    '30-Day Study Plan',
    'Unlimited MCQs',
    'AI Career Chat',
    'Ad-Free Experience',
  ];

  const onRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#312e81']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* NAVBAR */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Premium</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.navBtn}>
          <Ionicons name="reload" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* SCROLLABLE CONTENT (LIKE StudyScreen) */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#FFF" />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons name="diamond" size={56} color="#FFD700" />
          <Text style={styles.headerTitle}>
            CareerLoop <Text style={{ color: '#FFD700' }}>PRO</Text>
          </Text>
          <Text style={styles.headerSubtitle}>
            Unlock your full career potential
          </Text>
        </View>

        {/* PLANS */}
        <View style={styles.planRow}>
          {plans.map(plan => {
            const active = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                style={[styles.planCard, active && styles.planActive]}
              >
                {plan.best && <Text style={styles.badge}>BEST VALUE</Text>}
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FEATURES */}
        <View style={styles.featuresBox}>
          <Text style={styles.featuresTitle}>Why Go Pro?</Text>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureText}>{f}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
            </View>
          ))}
        </View>

        {/* NORMAL FOOTER (NOT FLOATING) */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.totalLabel}>Total to pay</Text>
            <Text style={styles.totalPrice}>
              {plans.find(p => p.id === selectedPlan)?.price}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => Alert.alert('TODO', 'Hook payment here')}
          >
            <LinearGradient
              colors={['#FFD700', '#F59E0B']}
              style={styles.upgradeBtn}
            >
              <Text style={styles.upgradeText}>Upgrade Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  navTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  scrollContent: { padding: 20 },

  header: { alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { color: '#94A3B8', marginTop: 6 },

  planRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  planCard: {
    width: '48%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(30,41,59,0.5)',
  },
  planActive: { borderWidth: 1.5, borderColor: '#FFD700' },
  badge: { color: '#FFD700', fontSize: 12, fontWeight: '800' },
  planTitle: { color: '#FFF', marginTop: 6, fontWeight: '700' },
  planPrice: { color: '#FFF', fontSize: 26, fontWeight: '800' },

  featuresBox: {
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  featureText: { color: '#CBD5F5' },

  footer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.9)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { color: '#94A3B8', fontSize: 12 },
  totalPrice: { color: '#FFF', fontSize: 26, fontWeight: '800' },

  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
  },
  upgradeText: { fontWeight: '800', marginRight: 6, color: '#000' },
});
