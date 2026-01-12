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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
// import RazorpayCheckout from 'react-native-razorpay'; // Not supported in Expo Go

const PremiumScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const featureList = [
    { name: 'Resume Recommendations', free: 'Basic (10)', premium: 'Unlimited' },
    { name: 'ATS Score Analysis', free: 'Summary Only', premium: 'Detailed Report' },
    { name: 'Study Plan', free: 'First 5 Days', premium: 'Full 30 Days' },
    { name: 'MCQ Practice', free: '10 / Day', premium: 'Unlimited + Explanations' },
    { name: 'AI Career Chat', free: '5 Msgs / Day', premium: 'Unlimited' },
    { name: 'Ad-Free Experience', free: '❌', premium: '✅' },
  ];

  const plans = [
    {
      id: 'monthly',
      title: 'Monthly Plan',
      price: '₹99',
      duration: '/ month',
      amount: 99,
      features: ['Full AI Access', 'Unlimited MCQs', 'Resume Polish'],
      bestValue: false
    },
    {
      id: 'yearly',
      title: 'Yearly Pro',
      price: '₹299',
      duration: '/ year',
      amount: 299,
      features: ['All Monthly Features', 'Priority Support', 'Save 75%'],
      bestValue: true
    },
  ];

  const { updateUser } = useAuth();

  const handlePurchase = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    try {
      // 1. Create Order
      const orderResponse = await paymentAPI.createOrder(plan.id, plan.amount);

      if (!orderResponse.data.success) {
        throw new Error("Order creation failed");
      }

      const { order } = orderResponse.data;
      const options = {
        description: `CareerLoop AI ${plan.title}`,
        image: 'https://via.placeholder.com/150',
        currency: 'INR',
        key: 'rzp_test_S2YBUcTyzPHio5',
        amount: order.amount,
        name: 'CareerLoop AI',
        order_id: order.id,
        theme: { color: colors.primary }
      };

      // 2. Open Checkout
      // Mock for Expo Go since native Razorpay is unavailable
      Alert.alert(
        'Payment Gateway',
        'In Expo Go, native payments are simulated. Proceeding to success...',
        [
          {
            text: 'Simulate Success',
            onPress: async () => {
              await verifyPaymentSuccess({
                razorpay_order_id: order.id,
                razorpay_payment_id: "pay_simulated_" + Date.now(),
                razorpay_signature: "simulated_signature",
              }, plan.id);
            }
          },
          { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) }
        ]
      );

      /* 
      // Native Razorpay code - requires Development Build, not Expo Go
      RazorpayCheckout.open(options).then(async (data) => {
        await verifyPaymentSuccess(data, plan.id);
      }).catch((error) => {
        Alert.alert('Payment Failed', error.description || 'Payment cancelled');
        setLoading(false);
      });
      */

    } catch (error) {
      console.error("Payment Error:", error);
      Alert.alert('Error', 'Payment initialization failed.');
      setLoading(false);
    }
  };

  const verifyPaymentSuccess = async (data, planId) => {
    try {
      const verifyRes = await paymentAPI.verifyPayment({
        ...data,
        planType: planId
      });

      if (verifyRes.data.success) {
        // UPDATE USER STATE IMMEDIATELY
        if (verifyRes.data.user) {
          await updateUser(verifyRes.data.user);
        }

        Alert.alert('Success! 🌟', 'Welcome to CareerLoop Pro! All features unlocked.', [
          {
            text: "Continue to Dashboard",
            onPress: () => {
              // Ensure we go to the main tab, explicitly resetting to dashboard if needed
              navigation.navigate('MainTabs', { screen: 'Dashboard' });
            }
          }
        ]);
      } else {
        Alert.alert('Verification Failed', 'Payment successful but verification failed.');
      }
    } catch (err) {
      Alert.alert('Error', 'Server error during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Unlock Your Career Potential 🚀</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Upgrade to CareerLoop Pro for unlimited access.
          </Text>
        </View>

        {/* Free vs Premium Comparison Table */}
        <Card style={styles.comparisonCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { flex: 2, color: colors.textSecondary }]}>Feature</Text>
            <Text style={[styles.columnHeader, { flex: 1.5, color: colors.textSecondary, textAlign: 'center' }]}>Free</Text>
            <Text style={[styles.columnHeader, { flex: 1.5, color: colors.premium, textAlign: 'center', fontWeight: 'bold' }]}>PRO</Text>
          </View>
          <View style={styles.divider} />
          {featureList.map((item, index) => (
            <View key={index} style={[styles.tableRow, index % 2 !== 0 && { backgroundColor: colors.surface }]}>
              <Text style={[styles.featureName, { flex: 2, color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.featureValue, { flex: 1.5, color: colors.textSecondary, textAlign: 'center' }]}>{item.free}</Text>
              <Text style={[styles.featureValue, { flex: 1.5, color: colors.premium, textAlign: 'center', fontWeight: 'bold' }]}>{item.premium}</Text>
            </View>
          ))}
        </Card>

        {/* Plan Selection */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.9}
            >
              <Card
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && { borderColor: colors.premium, borderWidth: 2 }
                ]}
                premium={plan.bestValue}
              >
                {plan.bestValue && (
                  <View style={[styles.badge, { backgroundColor: colors.premium }]}>
                    <Text style={styles.badgeText}>BEST VALUE</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View>
                    <Text style={[styles.planTitle, { color: colors.text }]}>{plan.title}</Text>
                    <Text style={[styles.planPrice, { color: colors.primary }]}>
                      {plan.price} <Text style={{ fontSize: 14, color: colors.textSecondary }}>{plan.duration}</Text>
                    </Text>
                  </View>
                  <Ionicons
                    name={selectedPlan === plan.id ? "radio-button-on" : "radio-button-off"}
                    size={24}
                    color={selectedPlan === plan.id ? colors.premium : colors.textSecondary}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.footerInfo}>
          <Text style={[styles.footerPrice, { color: colors.text }]}>
            Total: {plans.find(p => p.id === selectedPlan)?.price}
          </Text>
          <Text style={[styles.footerPlan, { color: colors.textSecondary }]}>
            {plans.find(p => p.id === selectedPlan)?.title}
          </Text>
        </View>
        <Button
          title={loading ? "Processing..." : "Upgrade Now ⚡"}
          onPress={handlePurchase}
          loading={loading}
          style={[styles.payButton, { backgroundColor: colors.primary }]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 4 },

  comparisonCard: { padding: 0, overflow: 'hidden', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', padding: 12, backgroundColor: 'rgba(0,0,0,0.03)' },
  columnHeader: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  featureName: { fontSize: 13, fontWeight: '500' },
  featureValue: { fontSize: 12 },

  plansContainer: { marginBottom: 20 },
  planCard: { marginBottom: 12, position: 'relative', marginTop: 8 },
  badge: { position: 'absolute', top: -10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 10 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontSize: 16, fontWeight: '600' },
  planPrice: { fontSize: 20, fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center' },
  footerInfo: { flex: 1 },
  footerPrice: { fontSize: 18, fontWeight: 'bold' },
  footerPlan: { fontSize: 12 },
  payButton: { width: '50%' }
});

export default PremiumScreen;