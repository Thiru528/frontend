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
  Dimensions,
  ImageBackground,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { BlurView } from 'expo-blur';
import CustomToast from '../../components/CustomToast';

const { width } = Dimensions.get('window');

const PremiumScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const { user, updateUser } = useAuth();

  const featureList = [
    { name: 'Resume AI Analysis', free: 'Summary Only', premium: 'Detailed Report 📝' },
    { name: 'AI Improvement Tips', free: 'Generic', premium: 'Personalized 🚀' },
    { name: 'Study Plan', free: '5 Days', premium: 'Full 30 Days 📅' },
    { name: 'MCQ Practice', free: '10 / Day', premium: 'Unlimited ♾️' },
    { name: 'AI Career Chat', free: '3 Msgs / Day', premium: 'Unlimited 💬' },
    { name: 'Ad-Free Experience', free: '❌', premium: '✅' },
  ];

  const plans = [
    {
      id: 'monthly',
      title: 'Monthly Starter',
      price: '₹99',
      duration: '/mo',
      amount: 99,
      save: null,
      features: ['Full AI Access', 'Unlimited MCQs'],
      bestValue: false
    },
    {
      id: 'yearly',
      title: 'Annual Pro',
      price: '₹299',
      duration: '/yr', // effectively ₹25/mo
      amount: 299,
      save: 'SAVE ₹889',
      subtext: '₹25/month',
      features: ['Priority Support', 'Early Access', 'All Monthly Features'],
      bestValue: true
    },
  ];

  // Refresh / Reload Handler
  const onRefresh = () => {
    // Just a visual refresh or re-check auth if needed
    if (updateUser && user) updateUser(user); // Force sync
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handlePurchase = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    try {
      const orderResponse = await paymentAPI.createOrder(plan.id, plan.amount);
      if (!orderResponse.data.success) throw new Error("Order creation failed");

      const { order } = orderResponse.data;

      console.log("💰 Initiating Payment for Order:", order.id);

      if (Platform.OS === 'web') {
        // --- REAL WEB CHECKOUT ---
        const loadScript = (src) => {
          return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
              resolve(true);
            };
            script.onerror = () => {
              resolve(false);
            };
            document.body.appendChild(script);
          });
        };

        const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

        if (!res) {
          Alert.alert('Error', 'Razorpay SDK failed to load. Are you online?');
          setLoading(false);
          return;
        }

        const options = {
          key: 'rzp_test_S2YBUcTyzPHio5', // Test Key
          amount: order.amount,
          currency: 'INR',
          name: 'CareerLoop AI',
          description: `Upgrade to ${plan.title}`,
          image: 'https://i.imgur.com/3g7nmJC.png',
          order_id: order.id,
          prefill: {
            name: user?.name || 'CareerLoop User',
            email: user?.email || 'user@example.com',
            contact: '9999999999'
          },
          theme: { color: colors.primary },
          handler: async function (response) {
            console.log('✅ Web Payment Authorized:', response);
            try {
              await verifyPaymentSuccess({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }, plan.id);
            } catch (vErr) {
              console.error(vErr);
              Alert.alert('Error', 'Verification Failed');
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              console.log('Checkout form closed');
            }
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

      } else {
        // --- MOBILE NATIVE SDK ---
        const RazorpayCheckout = require('react-native-razorpay').default;

        const options = {
          description: `Upgrade to ${plan.title}`,
          image: 'https://i.imgur.com/3g7nmJC.png',
          currency: 'INR',
          key: 'rzp_test_S2YBUcTyzPHio5', // Test Key
          amount: order.amount,
          name: 'CareerLoop AI',
          order_id: order.id,
          prefill: {
            email: user?.email || 'user@example.com',
            contact: '9999999999',
            name: user?.name || 'CareerLoop User'
          },
          theme: { color: colors.primary }
        };

        RazorpayCheckout.open(options)
          .then(async (data) => {
            console.log(`✅ Payment Authorized: ${data.razorpay_payment_id}`);
            await verifyPaymentSuccess(data, plan.id);
          })
          .catch((error) => {
            console.error("❌ Razorpay Error:", error);
            Alert.alert('Payment Failed', error.description || 'Payment Cancelled');
            setLoading(false);
          });
      }

    } catch (error) {
      console.error("Payment Init Error:", error);
      Alert.alert('Error', 'Could not initiate payment.');
      setLoading(false);
    }
  };

  const verifyPaymentSuccess = async (data, planId) => {
    try {
      const verifyRes = await paymentAPI.verifyPayment({ ...data, planType: planId });

      if (verifyRes.data.success) {
        if (verifyRes.data.user) await updateUser(verifyRes.data.user);

        setToast({
          visible: true,
          message: 'Payment Successful! Redirecting...',
          type: 'success'
        });

        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }, 2000);

      } else {
        throw new Error("Verification failed");
      }
    } catch (err) {
      Alert.alert('Error', 'Payment verified but account update failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#312e81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      <SafeAreaView style={styles.safeArea}>

        {/* NavBar with Back Button & Reload */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Premium</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.backButton}>
            <Ionicons name="reload-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#FFF" />
          }
        >

          {/* Launch Offer Banner */}
          <View style={styles.launchBanner}>
            <LinearGradient
              colors={['#FFD700', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.launchBannerGradient}
            >
              <Text style={styles.launchBannerText}>🔥 Launch Offer · Ends Soon</Text>
            </LinearGradient>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.crownContainer}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.crownGradient}
              >
                <Ionicons name="diamond" size={52} color="#FFD700" />
              </LinearGradient>
            </View>
            <Text style={styles.headerTitle}>CareerLoop <Text style={{ color: '#FFD700' }}>PRO</Text></Text>
            <Text style={styles.headerSubtitle}>Unlock your full career potential</Text>
          </View>

          {/* Plan Selection Cards */}
          <View style={styles.plansContainer}>
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => setSelectedPlan(plan.id)}
                  activeOpacity={0.9}
                  style={[
                    styles.planCard,
                    isSelected ? styles.planCardSelected : styles.planCardUnselected
                  ]}
                >
                  {plan.bestValue && (
                    <View style={styles.badge}>
                      <LinearGradient colors={['#FFD700', '#F59E0B']} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={styles.badgeText}>BEST VALUE</Text>
                      </LinearGradient>
                    </View>
                  )}
                  <View style={styles.planHeader}>
                    <Text style={[styles.planTitle, isSelected ? { color: '#FFF' } : { color: '#94a3b8' }]}>{plan.title}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#FFD700" />}
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.planPrice, isSelected ? { color: '#FFF' } : { color: '#e2e8f0' }]}>
                      {plan.price}
                    </Text>
                    <Text style={[styles.planDuration, isSelected ? { color: 'rgba(255,255,255,0.7)' } : { color: '#64748B' }]}>{plan.duration}</Text>
                  </View>
                  {plan.subtext && <Text style={styles.subtext}>{plan.subtext}</Text>}
                  {plan.save && <Text style={styles.saveText}>{plan.save}</Text>}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Why Go Pro?</Text>
            {featureList.map((item, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureName}>{item.name}</Text>
                  <Text style={styles.featureFree}>Free: {item.free}</Text>
                </View>
                <View style={styles.featureProContainer}>
                  <Text style={styles.featurePro}>{item.premium}</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 120 }} />

        </ScrollView>

        {/* Floating Footer */}
        <View style={styles.footer}>
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.9)', 'rgba(15, 23, 42, 1)']}
            style={styles.footerGradient}
          >
            <View>
              <Text style={styles.totalLabel}>Total to pay</Text>
              <Text style={styles.totalPrice}>{plans.find(p => p.id === selectedPlan)?.price}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePurchase}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FFD700', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeButton}
              >
                {loading ? (
                  <Text style={styles.upgradeBtnText}>Processing...</Text>
                ) : (
                  <>
                    <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
                    <Ionicons name="arrow-forward" size={20} color="#000" style={{ marginLeft: 4 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 10 },

  launchBanner: { alignItems: 'center', marginBottom: 20 },
  launchBannerGradient: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5
  },
  launchBannerText: { color: '#000', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },

  header: { alignItems: 'center', marginBottom: 35 },
  crownContainer: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)',
    overflow: 'hidden'
  },
  crownGradient: {
    width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { fontSize: 36, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, color: '#94A3B8', marginTop: 4, letterSpacing: 0.5 },

  plansContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
  planCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    position: 'relative',
  },
  planCardSelected: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderColor: '#FFD700',
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
  },
  planCardUnselected: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badge: {
    position: 'absolute', top: -14, alignSelf: 'center',
    zIndex: 10
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#000' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'flex-start' },
  planTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { fontSize: 26, fontWeight: '800' },
  planDuration: { fontSize: 14, marginLeft: 2, fontWeight: '500' },
  subtext: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  saveText: { color: '#4ade80', fontSize: 13, fontWeight: '800', marginTop: 8 },

  featuresContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  featuresTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 20 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  featureName: { fontSize: 15, color: '#e2e8f0', fontWeight: '600' },
  featureFree: { fontSize: 12, color: '#64748B', marginTop: 2 },
  featureProContainer: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  featurePro: { fontSize: 13, color: '#FFD700', fontWeight: '700', textAlign: 'right', marginBottom: 2 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  footerGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)'
  },
  totalLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  totalPrice: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  upgradeButton: {
    paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 30,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8
  },
  upgradeBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },

  // Navbar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  navTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default PremiumScreen;