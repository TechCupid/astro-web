import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, Alert, Image, SafeAreaView, Modal,FlatList,ScrollView,Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OTPTextInput from 'react-native-otp-textinput';


import api from './api/apiClient';
import { getOrCreateDeviceId } from './utils/deviceId';

import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useApi } from './ApiContext';
import { LinearGradient } from 'expo-linear-gradient';
import countryCodes from './countryCodes';
import Icon from 'react-native-vector-icons/Ionicons';  // or any other icon set
import Ionicons from 'react-native-vector-icons/Ionicons';

import { initEarlyFCMToken, registerForPushNotificationsAsync } from './RegisterPushNotification';



const AstromobileFlow = ({ navigation }) => {
  const { API_BASE_URL } = useApi();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [agree, setAgree] = useState(false);
  const [timer, setTimer] = useState(90);
  const otpRef = useRef();
  const [otpInfoMsg, setOtpInfoMsg] = useState('');
 const [validationMessage, setValidationMessage] = useState('');
const [showValidationModal, setShowValidationModal] = useState(false);
const [selectedCode, setSelectedCode] = useState({ value: '+91', flag: '🇮🇳' });
const [showCodeDropdown, setShowCodeDropdown] = useState(false);
const [searchText, setSearchText] = useState('');
const searchInputRef = useRef(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);

useEffect(() => {
  autoLogin();
}, []);




useEffect(() => {
  // 🌐 ADD THIS LINE: Exit immediately if on web
  if (Platform.OS === 'web') return; 

  let mounted = true;
  (async () => {
    try {
      await initEarlyFCMToken();
    } catch (err) {
      console.warn('initEarlyFCMToken failed', err);
    }
  })();

  return () => { mounted = false; };
}, []);




  useEffect(() => {
    let interval;
    if (otpVisible && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpVisible, timer]);

  const autoLogin = async () => {
  try {
    const token = await AsyncStorage.getItem('ASTRO_JWT');
    const astroId = await AsyncStorage.getItem('astroMobile');

    if (!token || !astroId) return;

    // 🔐 validate token
    await api.get(`${API_BASE_URL}/api/astrologers/validate-token`);


    // ✅ token valid → skip OTP
    navigation.replace('AstroMainScreen', { astroId });

  } catch (err) {
    console.log('❌ Token invalid → clearing storage');
    await AsyncStorage.removeItem('ASTRO_JWT');
    await AsyncStorage.removeItem('astroMobile');
  }
};



  const handleMobileSubmit = () => {
    if (mobile.trim().length !== 10) {
       setValidationMessage('Enter a valid 10-digit mobile number');
     setShowValidationModal(true);
      return;
    }
    if (!agree) {
       setValidationMessage('Please agree to the Terms and Privacy Policy');
     setShowValidationModal(true);
      return;
    }

    setOtpVisible(true);
    setTimer(90);
    setOtpInfoMsg(`OTP sent to +91 ${mobile}`);
  };
const filteredCountries = countryCodes.filter((item) =>
  item.name.toLowerCase().includes(searchText.toLowerCase())
);

const toggleCodeDropdown = () => setShowCodeDropdown(prev => !prev);

const onSelectCode = (item) => {
  setSelectedCode({ value: item.value, flag: item.flag });
  setShowCodeDropdown(false);
  setSearchText('');
};

const handleOtpVerification = async () => {
  if (otp.length !== 4) {
    setValidationMessage('Please enter a valid 4-digit OTP.');
    setShowValidationModal(true);
    return;
  }

  try {
    const deviceId = await getOrCreateDeviceId();
    console.log('📱 DEVICE ID GENERATED →', deviceId);

    // ✅ 1. Verify OTP
    const response = await api.get(
      `${API_BASE_URL}/api/astrologers/details/verifyOtp`,
      {
        params: { astroMobileNo: mobile, otp },
        headers: { 'X-DEVICE-ID': deviceId },
      }
    );

    const { token, astro } = response.data;

    if (!token || !astro?.astroId) {
      setValidationMessage('Invalid login response from server');
      setShowValidationModal(true);
      return;
    }

    // ✅ 2. Save Session
    await AsyncStorage.setItem('ASTRO_JWT', token);
    await AsyncStorage.setItem('loggedInAstro', JSON.stringify(astro));
    await AsyncStorage.setItem('APP_FOR', 'ASTRO');
    await AsyncStorage.setItem('astroMobile', astro.astroId);

    // ✅ 3. Navigate based on status (Registration Flow)
    switch (astro.astroVerifyStatus) {
      case 'APPROVED':
        // ... (Your existing FCM and Online Status logic)
        navigation.navigate('AstroMainScreen', { astroId: astro.astroId });
        break;

      case 'INITIATE':
        // 📄 Registration Page 1: Personal Info
        console.log("🟠 INITIATE — Redirecting to Page 1");
        navigation.navigate('AstrologerRegistration', { astroMobile: astro.astroId });
        break;

      case 'IN_PROGRESS':
      case 'PENDING':
        // 📄 Registration Page 2: Other/Professional Details
        console.log("🔵 IN_PROGRESS/PENDING — Redirecting to Page 2");
        navigation.navigate('AstrologerOtherDetails', { 
            astroMobile: astro.astroId,
            showModal: astro.astroVerifyStatus === 'IN_PROGRESS' 
        });
        break;

      default:
        navigation.navigate('AstrologerRegistration', { astroMobile: astro.astroId });
    }
  } catch (error) {
    console.log("❌ Verification Error:", error.response?.status);

    // ✅ 4. IF NOT REGISTERED (404), GO TO REGISTRATION PAGE 1
    if (error.response?.status === 404) {
      console.log("🆕 Number not found. Moving to registration...");
      navigation.navigate('AstrologerRegistration', { astroMobile: mobile });
    } 
    else if (error.response?.status === 401) {
      setValidationMessage('Invalid OTP');
      setShowValidationModal(true);
    } 
    else {
      setValidationMessage('Something went wrong during OTP verification');
      setShowValidationModal(true);
    }
  }
};

const handleResendOtp = () => {
  setTimer(90);
  otpRef.current?.clear();
  setOtpInfoMsg(`OTP has been resent to ${selectedCode.value} ${mobile}`);
  setShowResendModal(true);
};


  const isGetOtpEnabled = mobile.length === 10 && agree;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('./assets/Appicon.jpeg')} style={styles.logo} />
        <Text style={styles.appTitle}>Astrology App</Text>
      </View>

      <Text style={styles.title}>Sign Up</Text>

<View style={{ width: '100%' }}>
  <View style={styles.inputWrapper}>
    <TouchableOpacity
      style={[styles.countryCodeButton, { flexDirection: 'row', alignItems: 'center' }]}
      onPress={toggleCodeDropdown}
    >
      <Text style={{ fontSize: 16 }}>{selectedCode.flag} {selectedCode.value}</Text>
      <Icon
        name={showCodeDropdown ? 'chevron-up' : 'chevron-down'}
        size={14}
        color="#333"
        style={{ marginLeft: 6 }}
      />
    </TouchableOpacity>

    <TextInput
      style={styles.input}
      keyboardType="number-pad"
      placeholder="MOBILE NUMBER"
      maxLength={10}
      value={mobile}
      onChangeText={setMobile}
    />
  </View>

  {/* Inline dropdown */}
{showCodeDropdown && (
  <View style={styles.dropdownContainer}>
    {/* Search Input */}
    <View style={styles.searchContainer}>
      <Icon name="search" size={18} color="#999" style={{ marginRight: 6 }} />
      <TextInput
        ref={searchInputRef}
        style={styles.searchInput}
        placeholder="Search country"
        value={searchText}
        onChangeText={setSearchText}
        autoFocus
        clearButtonMode="while-editing"
      />
    </View>

    {/* Country List */}
    {filteredCountries.length > 0 ? (
      <FlatList
        data={filteredCountries}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: 200 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.codeItem}
            onPress={() => onSelectCode(item)}
          >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16 }}>
                    <Text style={{ fontSize: 20 }}>{item.flag} </Text>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
                    ({item.value})
                  </Text>
                </View>
              </TouchableOpacity>
        )}
        
      />
    ) : (
      <View style={{ padding: 10 }}>
        <Text style={{ textAlign: 'center', color: '#999' }}>No results found</Text>
      </View>
    )}
  </View>
)}
</View>

      {!otpVisible && (
        <>
          <View style={styles.checkboxRow}>
            <TouchableOpacity onPress={() => setAgree(!agree)}>
              <MaterialIcons
                name={agree ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={agree ? '#FF6600' : '#999'}
              />
            </TouchableOpacity>
             <Text style={styles.checkboxText}>
        I agree to the{" "}
        <Text style={styles.link} onPress={() => setShowTermsModal(true)}>
          Terms
        </Text>{" "}
        &{" "}
        <Text style={styles.link} onPress={() => setShowPrivacyModal(true)}>
          Privacy Policy
        </Text>
        </Text>
          </View>


          {otpInfoMsg !== '' && (
            <Text style={styles.otpInfoText}>{otpInfoMsg}</Text>
          )}

          <TouchableOpacity
            style={[
              styles.getOtpButton,
              { backgroundColor: isGetOtpEnabled ? '#FF6600' : '#ccc' }
            ]}
            onPress={handleMobileSubmit}
            disabled={!isGetOtpEnabled}
          >
            <Text style={styles.getOtpText}>Get OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {otpVisible && (
        <View style={styles.otpSection}>
          {otpInfoMsg !== '' && (
            <Text style={styles.otpInfoText}>{otpInfoMsg}</Text>
          )}
          <Text style={styles.otpNote}>Enter the OTP</Text>

          <OTPTextInput
            ref={otpRef}
            handleTextChange={(text) => setOtp(text)}
            inputCount={4}
            tintColor="#FF6600"
            textInputStyle={styles.otpInput}
          />

          <TouchableOpacity style={styles.verifyButton} onPress={handleOtpVerification}>
            <Text style={styles.verifyText}>Verify</Text>
          </TouchableOpacity>

          <Text style={styles.timerText}>
            Didn't get the OTP?{' '}
            <Text style={styles.timerColor}>
              {String(Math.floor(timer / 60)).padStart(2, '0')}:
              {String(timer % 60).padStart(2, '0')}
            </Text>
          </Text>

          <TouchableOpacity onPress={handleResendOtp} disabled={timer > 0}>
            <Text style={[styles.linkText, timer > 0 && { color: '#ccc' }]}>
              Resend OTP via SMS
            </Text>
          </TouchableOpacity>
        </View>
      )}

       {/* Validation Modal */}
          <Modal visible={showValidationModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <AntDesign name="exclamationcircle" size={30} color="#FF3B30" />
        </View>
        <Text style={styles.modalTitle}>Validation Error</Text>
        <Text style={styles.modalMessage}>{validationMessage}</Text>
      </View>

      <View style={styles.separator} />
      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBottom}
      >
        <TouchableOpacity
          onPress={() => setShowValidationModal(false)}
          style={styles.okButton}
        >
          <Text style={styles.okText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

  {/* succes modal */}
      <Modal visible={showResendModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
         <AntDesign name="checkcircle" size={30} color="#4BB543" />
        </View>
        <Text style={styles.modalTitle}>OTP Resent</Text>
        <Text style={styles.modalMessage}>
          OTP has been resent to +91 {mobile}
        </Text>
      </View>

      <View style={styles.separator} />
      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBottom}
      >
        <TouchableOpacity
          onPress={() => setShowResendModal(false)}
          style={styles.okButton}
        >
          <Text style={styles.okText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>


 {/* TERMS AND CONDITION  */}

 <Modal visible={showTermsModal} transparent animationType="slide">
        <View style={styles.modalOverlay1}>
           <View style={styles.termsBox}>
         
            {/* Close Icon */}
    <TouchableOpacity 
      style={styles.closeIcon} 
      onPress={() => setShowTermsModal(false)}
    >
      <Ionicons name="close" size={20} color="000" />
    </TouchableOpacity>

      <Text style={styles.modalTitle1}>Terms and Conditions</Text>
<ScrollView style={styles.modalScrollArea}>
              <Text style={styles.termsContent}>
         {`These terms and conditions of Use (hereinafter referred as “Terms of Usage”) describe and govern the User’s use of the content and services offered by Tech Informatic Solutions . through www.techinformatic.com (hereinafter referred as “We” “TiS” “us” “our” “Tech Informatic Solutions application” “Website”).

UPDATION :
The Website may update/amend/modify these Terms of Usage from time to time. The User is responsible to check the Terms of Usage periodically to remain in compliance with these terms.

USER CONSENT :
By accessing the Website and using it, you (“Member”, “You”, “Your”) indicate that you understand the terms and unconditionally & expressly consent to the Terms of Usage of this Website. If you do not agree with the Terms of Usage, please do not click on the “I AGREE” button. The User is advised to read the Terms of Usage carefully before using or registering on the Website or accessing any material, information or services through the Website. Your use and continued usage of the Website (irrespective of the amendments made from time to time) shall signify your acceptance of the terms of usage and your agreement to be legally bound by the same.
By accessing the Website and using it, you (“Member”, “You”, “Your”) indicate that you understand the terms and unconditionally & expressly consent to the Terms of Usage of this Website. If you do not agree with the Terms of Usage, please do not click on the “I AGREE” button. The User is advised to read the Terms of Usage carefully before using or registering on the Website or accessing any material, information or services through the Website. Your use and continued usage of the Website (irrespective of the amendments made from time to time) shall signify your acceptance of the terms of usage and your agreement to be legally bound by the same.

GENERAL DESCRIPTION :
The Website is an internet-based portal having its existence on World Wide Web, Application and other electronic medium and provides astrological content, reports, data, telephone, video and email consultations (hereinafter referred as “Content”). The Website is offering “Free Services” and “Paid Services” (Collectively referred as “Services”). Free Services are easily accessible without becoming a member however for accessing the personalised astrological services and/or receive additional Content and get access to Paid Services, You are required to register as a member on the portal. By registering for Paid Services, a Member agrees to:
To provide current, complete, and accurate information about himself as prompted to do so by the Website.
To maintain and update the above information as required and submitted by you with the view to maintain the accuracy of the information being current and complete.

REGISTRATION AND EILIGIBLITY :
The User of the Website must be a person who can form legally binding contracts under Indian Contract Act, 1872. A minor under the age of eighteen (18) in most jurisdiction, are not permitted to avail the services provided on the Website without a legal guardian in accordance with the applicable laws. The Website would not be held responsible for any misuse that may occur by virtue of any person including a minor using the services provided through the Website.
For the User to avail the services, the User will be directed to Register as a Member on the Website whereby You (User) agree to provide update, current and accurate information while filling up the sign-in form. All information that you fill and provide to the Website and all updates thereto are referred to in these Terms of Usage as 'Registration Data.'
An account could be created by you through the Website ID (Your Phone Number) and password (OTP) or other log-in ID and password which can include a facebook, gmail or any other valid email ID. The User while creating an account hereby represents and warrants that all the information provided by the User is current, accurate and complete and that the User will maintain the accuracy and keep the information updated from time to time. Use of another User’s account information for availing the services is expressly prohibited. If in case it is found that the information so supplied on the Website is inaccurate, incomplete, untrue and not current, the Website has the right to suspend or terminate the User’s account and restrict/refuse the use of the Website by such User in future.
The right to use this Website is personal to the User and is not transferable to any other person or entity. The User would be responsible for protecting the confidentiality of User’s passwords and other information required for the purposes of registration. The User would be fully responsible for all the activities that occur under the User’s account with the Website. The Website cannot and will not be liable for any loss or damage arising from the User’s failure to maintain secrecy and confidentiality. The User shall notify the Website immediately if they become aware of any unauthorized use of their Account(s) or breach of any security. The User must log out from its account at the end of the session.
The User while availing any service shall be informed whether the service so rendered is personal to the Website or is available from a Third party. The Website shall have no control or monitoring on the information disseminated to any third party via the Website.
The User agrees, understands and confirms that his/ her personal data including without limitation to details relating to debit card/ credit card transmitted over the Internet may be susceptible to misuse, hacking, theft and/ or fraud and that the Website or the Payment Service Provider(s) have no control over such matters.
The Website does not permit the use of the Services by any User under the following conditions: -
If the User is a resident of any jurisdiction that may prohibit the use of the Services rendered by the Website.
If the User is a resident of any State/Country that prohibits by way of law, regulation, treaty or administrative act for entering into trade relations or/and
Due to any religious practices.
If the User has created multiple accounts using various mobile numbers. The User may not have more than one active account with the Website.

FEATURE “CALL WITH ASTROLOGER” :
The Website is providing certain service which is available through the medium of telecommunication with the Astrologer listed and enrolled with the Website. By agreeing to the present Terms of Usage, you are also giving your unconditional consent to the Website to arrange a call with you on your mobile number even though your number is on DND service provided by your mobile service provider.

WEBSITE CONTENT :
The Website and any individual Websites which may be available through external hyperlinks with the Website are private property.
All interaction on this Website inclusive of the guidance and advice received directly from the Licensed Provider must comply with these Terms of Usage.
The User shall not post or transmit through this Website any material which violates or infringes in any way upon the rights of others, or any material which is unlawful, abusive, defamatory, invasive of privacy, vulgar, obscene, profane or otherwise objectionable, which encourages conduct that would constitute a criminal offence, give rise to civil liability or otherwise violate any law.
The Website shall have a right to suspend or terminate access by such User or terminate the User’s registration and such User shall not gain access to the Website.
The Website reserves the right to terminate the access or to change or discontinue any aspect or feature of the Website including, but not limited to, content, graphics, deals, offers, settings, etc.
Any information other the guidance and advice, received directly from the Third-Party Service Provider, the educational, graphics, research sources and other incidental information on the Site, the content, should not be considered as medical advice.
The Website does not take guarantee regarding the medical advice, if provided, by the third-party service provider inclusive of registered astrologers with the site. The User should always talk to an appropriately qualified health care professional for diagnosis and treatment including information regarding which medications or treatment may be appropriate for the User. None of the Content represents or warrants that any particular medication or treatment is safe, appropriate, or effective for you. TiS does not endorse any specific tests, medications, products or procedures.
The Website does not take guarantee of any untoward incident that may happen with the User after seeking the Service. The Website or the Service Provider providing the advice is not liable and does not guarantee any results as expected by the User and accessing the Website in such scenario is purely at the risk of the User.
By using the Site, Application or Services, User hereby agrees that any legal remedy or liability that you seek to obtain for actions or omissions of other Members inclusive of the service provider registered with the Website or other third parties linked with the Website, shall be limited to claim against such particular party who may have caused any harm. You agree not to attempt to impose liability on or seek any legal remedy from the Website with respect to such actions or omissions.
 
USER ACCOUNT ACCESS :
The Website shall have access to the account and the information created by the User for ensuring and maintaining the high-quality services provided by the Website and for addressing the need of the customer in the most effective manner. User hereby consents for the unconditional access of the account by the Website, its employees, agents and other appointed person in such regard. For the purpose of addressing the complaints (if any received) and any suspected abuse reported, the Website shall investigate on case-to-case basis from the records available. The User is directed to read the terms provided in the Privacy Policy as regards such records.

PRIVACY POLICY :
The User hereby consents, expresses and agrees that the User has read and fully understand the Privacy Policy of the Website. The User further consents that the terms and contents of such Privacy policy is acceptable to the User inclusive of any update/alteration/change made and duly displayed on the Website.

BREACH AND TERMINATION :
The Website may, in whole or in part, without informing the User, modify, discontinue, change or alter the services ordered or the Account of the User registered with the Website. The Website may or may not issue notice or provide any reason for such action taken by the Website.
Violation of any conditions mentioned in this Terms of Usage shall lead to immediate cancellation of the Registration of the User, if registered with the Website. The Website reserves right to terminate and initiate action immediately, if:
The Website is not able to verify and authenticate the Registration data or any other relevant information provided by the User.
The Website believes that the actions of the User may cause legal liability for the Website, other Users or any service provider linked with the Website.
The Website believes that the User has provided the Website with false and misleading Registration Data or there is interference with the other Users or the administration of the services, or have violated the privacy policy as listed by the Website.
For the Service Provider inclusive of the Astrologer, You understand and agree that your relationship with the Website is limited to being a member and You act exclusively on your own behalf and for your own benefit. The Website may terminate and de-activate the Profile of such service provider for any violation of the present terms of usage and the Service Terms and Conditions agreed upon between the parties while registration of the data by such Service Provider.

DELIVERY, CANCELLATION AND REFUND :
No refund shall be processed on the order of any reports under any circumstances if the order has reached the “processing” (Assigned to an Astrologer) stage. The risk and liability of placing order in a haste and careless manner totally lies with the User and the Website is not responsible for any refund once the processing stage has started.
No refund shall be processed once the Order has been placed and executed. However, if the User intends to cancel a successfully placed order before execution, the User is required to contact the customer care team within 1 (one) hour of making the payment, whereafter it is totally at the discretion of the Website whether to issue refund.
Any technical delay or glitch reported in the Website during the processing of the request which includes generating reports by the service provider i.e. Astrologer shall not be eligible for claiming refund. The User agrees that the timelines are approximate and all essentials steps would be taken to adhere to the timelines as displayed.
No refund shall be processed for the reason that in-correct information or data has been provided by You. The User agrees to be careful while providing any information to the Website and must re-check the information filled before clicking on “Submit”. The User can request for change in the in-correct information or data entered provided, the request for such change has been made with the customer care within 1 (one hour) of execution of the service rendered by the service provider.
No refund shall be processed for return of any damaged product. The User undertakes and agrees that by ordering any product as displayed on the Website, the Registered User shall be fully responsible for any damaged caused to the product, post its delivery. For orders made via “Cash on Delivery” method of payment, the User shall be charged for the cost of the product as displayed by the Website and the shipping/custom/courier charges as applicable, if the product is returned.
Refund on pro-rata basis may be considered for any delay in the activation of the subscription services and any damage that may be caused to the product while in transit shall be dealt by the Website and its agencies.
You agree that the display picture for the products listed for purchase by the User are for reference purpose only and the Website will try to deliver the product ordered in an as-is condition as displayed on the Website. The User is advised to exercise discretion in such case and no refund shall be issued on such grounds.
The services offered and the products sold are strictly not meant to replace any philosophical, emotional or medical treatment. The Website holds no responsibility or liability about the reality or reliability of the astrological effects on the human physiology, by the gems represented and sold on the Website. The placing of order for buying such products or taking the services is solely on the discretion and will of the User and the Website does not have any responsibility upon the products sold. The User is advised to exercise discretion in such case and no refund shall be issued on such grounds.
No refund shall be processed for providing a wrong contact number for the purpose of availing the “Call with Astrologer” feature. The User once opted for this feature is advised to keep the Contact Number in full coverage area and must answer the call when received. No refund shall be processed for any call which gets connected.
The refunds, if any, shall be processed after deduction of the transaction charges levied by the Bank and/or the Payment Gateway, to & fro cost of the shipping and/or courier charges (With regard to purchase of a product listed on the Website), customs duty (if levied) and/or any other charges that may have been incurred by the Website during processing and/or delivering the service, as applicable.
In case the Website or Payment gateway’s webpage, that is linked to the Website, is experiencing any server related issues like ‘slow down’ or ‘failure’ or ‘session timeout’, the User shall, before initiating the second payment, check whether his/her Bank Account has been debited or not and accordingly resort to one of the following options:
In case the Bank Account appears to be debited, ensure that you do not make the payment twice and immediately thereafter contact the Website via customer care to confirm payment.
In case the Bank Account is not debited, the User may initiate a fresh transaction to make payment.
However, refund for multiple payment, if any, even after the above precaution against the same order shall be refunded in full without deduction of the transaction charges as mentioned above. The Website shall only retain the cost of one single order as intended to be placed by the User.
If there are orders that the Website is unable to accept and must cancel, the Website at its sole discretion, reserves the right to refuse or cancel any order for any reason whatsoever. Some situations may result in the order being cancelled and include, without limitation, non-availability of the service, inaccuracy, error in pricing information or other problems as identified. If the User’s order is cancelled after charges being paid against the said service, the said amount paid for booking shall be refunded.

USER OBLIGATION :
The User (inclusive of the astrologer and the Member Customer) under an obligation not to violate the privacy policy, terms and conditions and any other terms as defined on the Website. The User represents that he is an individual and not a corporation or other legal business entity. The rights to use the Website’s services is personal to the User.The User shall while using the Website and engaged in any form of communication on any of the forums inclusive of the products listed on the Website shall not violate the terms and conditions which are inclusive of:-
The User shall not Post, publish or transmit any messages that is false, misleading, defamatory, harmful, threatening, abusive, harassing, defamatory, invades another's privacy, offensive, promotes racism, hatred or harm against any individual or group or religion or caste, infringes another's rights including any intellectual property rights or copyright or trademark, violates or encourages any conduct that would violate any applicable law or regulation or would give rise to civil liability.
The User shall not upload or post or otherwise make available any content that User do not have a right to make available, under any law or under contractual or fiduciary relationships.
The User shall not upload or post or otherwise make available any content that infringes any patent, trademark, trade secret, copyright or other proprietary rights of any party. The User may, however, post excerpts of copyrighted material so long as they adhere to Fair Use guidelines.
The User shall not collect screen names and email addresses of members who are registered on the Website for purposes of advertisement, solicitation or spam.
The User shall not send unsolicited email, junk mail, spam, or chain letters, or promotions or advertisements for products or services.
The User shall not upload or distribute files that contain viruses, corrupted files, or any other similar software or programs that may damage the operation of the Website or another’s computer.
The User shall not engage in any activity that interferes with or disrupts access to the Website
The User shall not attempt to gain unauthorized access to any portion or feature of the Website, any other systems or networks connected to the Website, to any of the services offered on or through the Website, by hacking, password mining or any other illegitimate means.
The User shall not violate any applicable laws or regulations for the time being in force within or outside India. The use and continuous use of the Website is subject to but not limited to using the services for personal use.
The User shall not resell or make any commercial use of the Services without the express written consent from the Website.
The User shall not violate these Terms of Usage including but not limited to any applicable Additional terms of the Website contained herein or elsewhere.
The User shall not Reverse engineer, modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any information or software obtained from the Website.
The User by becoming a Registered member of the Website agrees to the following situations, which list is not exhaustive and may include services incidental to the below mentioned:-
The User agrees to receive certain specific emails and SMS alongwith calls from the Website.
The User agrees not to transmit via the Website any unlawful, harassing, libelous, abusive, threatening, harmful, vulgar, obscene or otherwise objectionable material of any kind or nature.
The User not to transmit any material that encourages conduct that could constitute a criminal offense, give rise to civil liability, or otherwise violate any applicable local, state, national or international law or regulation. Attempts to gain unauthorized access to other computer systems are prohibited.
The User shall not interfere with any other members' use or enjoyment of the Website or Services.
The User is under an obligation to report any misuse or abuse of the Site. If you notice any abuse or misuse of the Site or anything which is in violation of this Agreement, you shall forthwith report such violation to Website by writing to Customer Care. On receipt of such complaint, Website may investigate such complaint and if necessary, may terminate the membership of the Member responsible for such violation abuse or misuse without any refund of the subscription fee.
Any false complaint made by a Member shall make such Member liable for termination of his / her membership without any refund of the subscription fee.
The Website reserves the right to withdraw its services to any customer who is found to be unreasonable or abusive during their conversation with the Service Provider inclusive of astrologer regardless of any reason.
While the Website shall take all steps to resolve any situation that is in violation of the above obligations arises, however if the situation is not controllable, the Website reserves its right to send a written warning henceforth. Such violations, if repeated by the User, shall lead to a total ban for transacting on the platform by such User. If any balance is present in the wallet of the User, the same shall be refunded subject to the other charges that may be applicable for such violations.
 
BANK ACCOUNT INFORMATION :
The User is under an obligation to provide his banking information as and when required. For that purpose, the obligation of the User are:-
The User agrees that the debit/credit card details provided by him/ her for use of the aforesaid Service(s) must be correct and accurate and that the User shall not use a debit/ credit card, that is not lawfully owned by him/ her or the use of which is not authorized by the lawful owner thereof. The User further agrees and undertakes to provide correct and valid debit/credit card details.
The User may pay the fees required, to the Website by using a debit/credit card or through online banking account. The User warrants, agrees and confirms that when he/ she initiates a payment transaction and/or issues an online payment instruction and provides his/ her card / bank details:
The User is fully and lawfully entitled to use such credit / debit card, bank account for such transactions;
The User is responsible to ensure that the card/ bank account details provided by him/ her are accurate;
The User is responsible to ensure sufficient credit is available on the nominated card/ bank account at the time of making the payment to permit the payment of the dues payable or the bill(s) selected by the User inclusive of the applicable Fee.
The User further agrees that if any part of these Terms of Usage are determined to be invalid or unenforceable pursuant to applicable law including, but not limited to, the warranty disclaimers and liability limitations set forth herein, then the invalid or unenforceable provision will be deemed superseded by a valid, enforceable provision that most closely matches the intent of the original provision and the remainder of these Terms of Usage shall continue in effect.

DISCLAIMER/LIMITATION OF LIABILITY/WARRANTY :
The User expressly understands and agree that, to the maximum extent permitted by applicable law, the Website does not provide warranties for the service. Astrological counselling provided through the Website is based on cumulative or individual knowledge, experience and interpretations of astrologers and as such, it may vary from one astrologer to another.
The Website is offering services through a diverse panel of Astrologers duly verified by the Website and such Service Provider (Astrologer) may from time to time make recommendations of using mantras, jantras, gemstones or other astrological remedies to be used by User. Such recommendations are being made in good faith by the astrologers and the Website and its subsidiaries, affiliates, officers, employees, agents, partners, and licensors make no warranty that :
the service will meet your requirements
the service will be uninterrupted, timely, secure or error-free
the results that may be obtained from the use of the service will be accurate or reliable
 the quality of any products, services, information or other material purchased or obtained by you through the service will meet your expectations and
any errors in the software will be corrected. You are required to make full disclosure about the emotional, mental and physical state of the person seeking advice from the panel of astrologers of Website so that the astrologers make an informed judgment about giving advice.
The Website, services and other materials are provided by the Website on an 'as is' basis without warranty of any kind, express, implied, statutory or otherwise, including the implied warranties of title, non-infringement, merchantability or fitness for a particular purpose. without limiting the foregoing, the Website makes no warranty that (i) the Website or the services will meet your requirements or your use of the Website or the services will be uninterrupted, timely, secure or error-free; (ii) the results that may be obtained from the use of the Website, services or materials will be effective, accurate or reliable; (iii) the quality of the Website, services or other materials will meet your expectations; or that (iv) any errors or defects in the Website, services or other materials will be corrected. no advice or information, whether oral or written, obtained by the User from the Website or through or from use of the services shall create any warranty not expressly stated in the terms of use.
To the maximum extent permitted by applicable law, the Website will have no liability related to User content arising under intellectual property rights, libel, privacy, publicity, obscenity or other laws. The Website also disclaims all liability with respect to the misuse, loss, modification or unavailability of any User content.
The Website will not be liable for any loss that the User may incur as a consequence of unauthorized use of their account or account information in connection with the Website or any services or materials, either with or without the User’s knowledge. The Website has endeavored to ensure that all the information on the Website is correct, but the Website neither warrants nor makes any representations regarding the quality, accuracy or completeness of any data, information, product or service. The Website shall not be responsible for the delay or inability to use the Website or related functionalities, the provision of or failure to provide functionalities, or for any information, software, products, functionalities and related graphics obtained through the Website, or otherwise arising out of the use of the Website, whether based on contract, tort, negligence, strict liability or otherwise. further, the Website shall not be held responsible for non-availability of the Website during periodic maintenance operations or any unplanned suspension of access to the Website that may occur due to technical reasons or for any reason beyond the Website's control.
The User understands and agrees that any material or data downloaded or otherwise obtained through the Website is done entirely at their own discretion and risk and they will be solely responsible for any damage to their computer systems or loss of data that results from the download of such material or data. The Website is not responsible for any typographical error leading to an invalid coupon. The Website accepts no liability for any errors or omissions, with respect to any information provided to you whether on behalf of itself or third parties.
The Services provided by the Website are for entertainment purposes only and the Website on behalf of itself and its suppliers, disclaims all warranties of any kind, express or implied, including without limitation any warranty of merchantability, fitness for a particular purpose, title, non-infringement and it makes no warranty or representation regarding the results that may be obtained from the use of content or services, the accuracy or reliability of any content obtained through the Services, any goods or services purchased or obtained through the Website, and makes no warranty that the services will meet your requirements, be uninterrupted, timely, secure or error-free. No advice or information, whether oral or written, obtained by you from the Website shall create any warranty.
The services may consist of the following, without limitation: Astrological content, Reports, Tarot readings, fortunes, numerology, predictions, live telephone consultations, email consultations or products sold through TiS Shop. TiS charges for the chat/call service offered on this platform on per minute basis and holds no responsibility or liability about the reality or reliability of the astrological effects on the human physiology, by the gems, any other products or services represented and sold on the website. No advice or information, whether oral or written, obtained by you shall create any warranty.
The advisors/consultants/astrologers are also members of the site and not employees of the Website or the company. However, the Website verifies the degrees, qualifications, credentials, and background of the advisors/consultants/astrologers but does not refer, endorse, recommend, verify, evaluate or guarantee any advice, information or other services provided by the advisors/consultants/astrologers or by the company, nor does it warrant the validity, accuracy, completeness, safety, legality, quality, or applicability of the content, anything said or written by, or any advice provided by the advisors/consultants/astrologers.
The website is not a suicide helpline platform. If you are considering or contemplating suicide or feel that you are a danger to yourself or to others, you may discontinue use of the services immediately at your discretion and please notify appropriate police or emergency medical personnel. If you are thinking about suicide, immediately call a suicide prevention helpline such as AASRA (91-22-27546669).
The Website shall not be liable for any inaccuracy, error or delay in, or omission of (a) any data, information or message, or (b) the transmission or delivery of any such data, information or message; or (c) any loss or damage arising from or occasioned by any such inaccuracy, error, delay or omission, non-performance or interruption in any such data, information or message. Under no circumstances shall the Website and/or the payment service providers, its employees, directors, and its third party agents involved in processing, delivering or managing the services, be liable for any direct, indirect, incidental, special or consequential damages, or any damages whatsoever, including punitive or exemplary arising out of or in any way connected with the provision of or any inadequacy or deficiency in the provision of the services or resulting from unauthorized access or alteration of transmissions of data or arising from suspension or termination of the services.
Notwithstanding anything to the contrary contained herein, TiS liability to you for any cause whatsoever, and regardless of the form of the action, will at all times be limited to the amount paid, if any, by you to the Website, for the service during the term of membership.

INDEMNIFICATION :
The User shall indemnify, defend and hold harmless the Website and its parent, subsidiaries, affiliates, officers, directors, employees, suppliers, consultants and agents from any and all third party claims, liability, damages and/or costs (including, but not limited to, attorney’s fees) arising from Your use of the Services, Your violation of the Privacy Policy or these Terms of Service, or Your violation of any third party's rights, including without limitation, infringement by You or any other user of Your account of any intellectual property or other right of any person or entity. These Terms of Service will inure to the benefit of Website’s successors, assigns, and licensees.

PROPRIETARY RIGHTS TO CONTENT :
The User acknowledges that the Content, including but not limited to text, software, music, sound, photographs, video, graphics or other material contained in sponsor advertisements or distributed via email, commercially produced information presented to Member by the Website, its suppliers, and/or advertisers, is protected by copyrights, trademarks, service marks, patents and/or other proprietary rights and laws. The User is not permitted to copy, use, reproduce, distribute, perform, display, or create derivative works from the Content unless expressly authorized by the Website, its suppliers, or advertisers. Moreover, the content such as images, text, designs, etc on all of the portals of the Website are taken from various online portals such as Google Images. TiS or Vedic Tech Informatic Solutions . is not liable for any copyrights of that content or data.

NOTICES :
Except as otherwise stated in these Terms of Service, all notices to a party shall be in writing and shall be made either via email or snail mail. Notice shall be deemed given 24 hours after an email is sent, or 3 days after deposit in the snail mail, to Member at the address provided by Member in the Registration Data and to the Website at the address set forth below:
“R-11/34, Rajnagar Ghaziabad 201001 (UP) India”

GOVERNING LAW AND JURISDICTION :
Any dispute, claim or controversy arising out of or relating to this Terms of Usage including the determination of the scope or applicability of this Terms of Usage to arbitrate, or your use of the Application or information to which it gives access, shall be determined by arbitration in India, before a sole arbitrator mutually appointed by Members and Website. Arbitration shall be conducted in accordance with the Arbitration and Conciliation Act, 1996. The seat of such arbitration shall be New Delhi. All proceedings of such arbitration, including, without limitation, any awards, shall be in the English language. The award shall be final and binding on the parties to the dispute.
Notwithstanding the foregoing, either party has the right to seek any interim or preliminary relief from a court of competent jurisdiction in New Delhi in order to protect the rights of such party pending the completion of any arbitration hereunder, and both parties agree to submit to the exclusive jurisdiction of the courts of India and venue in New Delhi for any such proceeding. If either party files an action contrary to this provision, the other party may recover attorneys' fees and costs up to One Lakh Rupees INR.
These Terms of Usage shall be governed by and construed in accordance with the laws of India without giving effect to any choice of law and principles that would require the application of the laws of a different state. If for any reason a court of competent jurisdiction finds any provision or portion of these Terms of Usage or Privacy Policy to be unenforceable or invalid, such provision shall be changed and interpreted so as to best accomplish the objectives of such unenforceable or invalid provision within the limits of applicable law, and the remainder of the Terms of Usage or Privacy Policy, as applicable, will continue in full force and effect. Headings are for reference purposes only and in no way define, limit, construe, or describe the scope or extent of such section. Any waiver of any provision of the Terms of Usage shall be effective only if in writing and signed by TiS. These Terms of Usage constitute the entire agreement between the parties with respect to the subject matter hereof and supersedes and replaces all prior or contemporaneous understandings or agreements, written or oral, regarding such subject matter.
These Terms of Usage and your use of the Services will be interpreted in accordance with the laws of India excluding its rules on conflicts of laws. The parties agree to submit any dispute arising under these Terms of Usage to the jurisdiction of a court located in New Delhi for any actions for which the parties retain the right to seek injunctive or other equitable relief in a court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation or violation of a party's copyrights, trademarks, trade secrets, patents, or other intellectual property rights.
`}
            </Text>
          </ScrollView>
          </View>
        </View>
      </Modal>



      {/* Privacy Modal */}
      <Modal visible={showPrivacyModal} transparent animationType="slide">
  <View style={styles.modalOverlay1}>
    <View style={styles.termsBox}>
      
     {/* Close Icon */}
    <TouchableOpacity 
      style={styles.closeIcon} 
      onPress={() => setShowPrivacyModal(false)}
    >
      <Ionicons name="close" size={20} color="000" />
    </TouchableOpacity>

      {/* Title */}
    <Text style={styles.modalTitle1}>Privacy Policy</Text>

      <ScrollView>
              <Text style={styles.termsContent}>

        <Text
          style={styles.link}
          onPress={() => Linking.openURL("https://www.techinformatic.com")}
        >
          www.techinformatic.com 
        </Text> {`(“we”, “Tech Informatic Solutions”, “TiS” (web and application) hereinafter referred as “website”) is committed to protect the privacy of the users of the website (including astrologers and buyers/customers whether registered or not registered). Please read this privacy policy carefully to understand how the website is going to use your information supplied by you to the Website.

This Privacy Policy is published in accordance with Rule 3(1) of the Information Technology (Intermediaries Guidelines) Rules, 2025 and Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 which requires publishing of the Privacy policy for collection, use, storage and transfer of sensitive personal data or information.

USER’S CONSENT
This Privacy Policy, which may be updated/amended from time to time, deals with the information collected from its users in the form of personal identification, contact details, birth details and any forecast made using the supplied information and how such information is further used for the purposes of the Website. By accessing the website and using it, you indicate that you understand the terms and expressly consent to the privacy policy of this website. If you do not agree with the terms of this privacy policy, please do not use this website.

Your continued use of this website shall confirm that you have provided your unconditional consent and confirm to the terms of this privacy policy as regards collecting, maintaining, using, processing and disclosing your personal and other information in accordance with this Privacy Policy.

This Privacy Policy is to be read alongwith the respective Terms of Use or other terms and conditions as provided on the Website.

COMMITMENT
The Website intends to protect the privacy of all kinds of users visiting the platform irrespective whether the user is a registered user or merely a visitor. It is recommended to every user to understand what types of personally identifiable information is collected. The Website employs the personally identifiable information for certain predictions however it is guaranteed that no direct or indirect use of such information which is revealed in the prediction for a member will be done except for the explicit purpose of communicating the horoscope charts and predictions to the member itself disclosing such information. It is further clarified that the Website does not in any manner deal in selling or renting the information supplied to the Website.

The Website does not commit to treat or provide solutions for users with weak mental health which is inclusive of any user who have thoughts related to committing suicide, self-destruction etc. Such users are advised to stop the use of the present website with immediate effect and any continued use of the website by such person would be considered solely at the user’s risk and the Website shall have no liability for any untoward event in such scenario. The Website declares that the information provided by such kind of user can be shared, if required, with law enforcement authorities. Such information is not protected from any kind of non-disclosure or confidential agreements either with the Website or with any third-party involved herein.

The Website does not commit in any manner whatsoever for the accuracy of the predictions made by the astrologers to any user. The Website does not take any guarantee/responsibility/liability regarding the reliability or reality of the gems and other related items represented and sold on the website. It is further declared by the Website that no warranty on such service is provided by the Website in any manner.

INFORMATION COLLECTED BY WEBSITE
PERSONAL IDENTIFIABLE INFORMATION: 
The information qualifies as personal in nature when the information collected identifies a specific end user. Such information would be collected by the website during the following actions:-

Creating an account/Registration data: While accessing the Website, the User of the Website may be required to create an account. The personal information which may be sought while creating an account shall include, but not limited to the Full name, Address, Telephone Number, Email-address, Date of Birth, Gender, Location, Photograph, any other items of ‘sensitive personal data or information” as such term is defined under the Information Technology (Reasonable Security Practices And Procedures And Sensitive Personal Data Of Information) Rules, 2011 enacted under the Information Technology Act, 2000, and any other detail required on the website during registration.
It is hereby informed to all the Users that the e-mail address or phone number together with a password or OTP is used for the purpose of securing User’s profile and for effective implementation of the personalized E-mail and SMS Services provided by the Website to the User. In the event that no registration is made by the User, the Website may not be able to provide any services due to non-availability of the personal identifiable information of the User.
Booking a paid service: While booking a service through Order Form, the personal information which may be sought would include, but not limited to the information as mentioned in Column 1(a), financial information inclusive of bank account information, credit card or debit card details or other payment instrument details through a secure third party gateway, IP (Internet protocol) Address and any other information that a User may provide during booking a paid service on the Website. Such information is kept highly confidential.
Log Files, IP Address and Cookies: The website collects information that is stored by your browser on your computer’s hard drive i.e. through cookies. It further automatically log generic information about the user’s computer connection to the Internet i.e. Session Data. The website may store temporary or permanent ‘cookies’ on the user’s computer. Cookies would allow the web server to recognize the user computer each time the user returns to the website including the time and date of the visit, viewing of page, length of time, verify registration or password information etc. Such cookies are usually only read by the server placed and the user may choose to block these cookies on their computers. Please note that if the cookies are turned off, the user may be prevented from using certain features of the website. The website uses the cookies to personalize the user’s experience on the website and to display an advertisement according to the user’s preferences.
Some of the services provided by the Website may direct the User to platform of third parties. Any Information provided by the User on such platforms may be dealt by them in the manner provided by the privacy policy formulated by such third-party platforms. The Website in this regard fully disclaims any liability(ies) or claim(s) which may arise by use/misuse of such information shared by the User, to any third party or any party not known to the Website. The website would not liable for the mis-use of such information shared by the User or by any third party.
We also collect details including but not limited to User feedback, comments, etc. that may be disclosed/informed/mentioned on any article/blog or groups/forums or other pages which the User may have access to while visiting the Website. For such information which is in public domain and accessible to all the Users and visitors of the Website, the User is advised to exercise its discretion before disclosing it as this information is susceptible to misuse.
Miscellaneous Activities: The Website may collect any other information which may be mandatory to be disclosed and further may receive any other information via email or other method inclusive of contract with regard to specific services availed from the Website or any products bought from the Website, such information may not be made part of the User-Member’s Profile but shall be used only for addressing the specific need or concern of the User.

NON-PERSONAL IDENTIFIABLE INFORMATION: 
The information qualifies as non-personal in nature when the information collected does not identify a specific end user. Such information is collected when the user visits the Website, cookies, etc. and would include but not limited to the following:

URL (Uniform Resource Locator) of the previous website visited by the User before visiting this website or the URL of the website the User visits after visiting this Website.
Internet service provider/IP Address/Telecom service provider.
Type of Browser used for accessing the website.
Geographical Location
Such non-personal identifiable information is used by the Website for the purposes including but not limited to troubleshoot connection problems, administer the website, analyze trends, gather demographic information, frequency of visits to the website, average length of visits, pages viewed during a visit, compliance with applicable law, and cooperate with law enforcement activities, etc.

The information is used for improving the site content and performance and the website may share this information with Third Party Service Providers and Third Party Advertisers to measure the overall effectiveness of the website’s online advertising, content, programming and for other bonafide purpose as required.

THE USER HEREBY REPRESENT AND CONFIRMS THAT THE INFORMATION PROVIDED TO THE WEBSITE IS AUTHENTIC, CORRECT, CURRENT AND UPDATED. THE WEBSITE AND ITS ENTITES SHALL NOT BE RESPONSIBLE FOR THE AUTHENTICITY OF THE INFORMATION THAT THE USER MAY PROVIDE. THE USER SHALL BE PERSONALLY LIABLE AND INDEMNIFY THE WEBSITE FOR THE BREACH OF ANY PROVISION.

SECURITY MEASURES:
The security of the personal information supplied by the User is very important to the Website and the website for the purpose of securing the information takes various measures inclusive of taking reasonable steps such as physical and electronic security measures to guard against the unauthorized access to the information. The personal information of a user is collected on a secured server. The payment details are entered on the Payment Gateway’s or Bank’s page on a secured SSL. The data is transferred between Bank’s page and payment’s gateways in an encrypted manner. However please note that no data transmission can be guaranteed to be completely secure. Hence the user is advised to take precaution and care against any sharing of the details submitted on the website included the log-in details as generated after registration. The website is not responsible for the security or confidentiality of communications the user may send through the internet using email messages, etc.

USAGE OF THE INFORMATION: 
The information collected by the Website or third party (like Google, Facebook etc) may be used for any purpose as may be permissible under the applicable law and shall include but not limited to the following: -

For providing a personalised browsing experience. While guaranteeing the anonymity of the user, the personal information collected in Clause “Personal Identifiable Information” may be used for research purposes, for improving the marketing and promotional efforts, to analyse usage, improve the content of the Website, product offering and for customising the Website’s layout for suiting the needs of its Users.
With IP tracking details and Cookies data, the Website will use it only for facilitating the usage of the website and provide personalised experience and any information which is sensitive in nature will not be provided to any third party without the consent of the User.
All information (and copies thereof) collected by Website, including without limitation Personal Information, User Data, and other information related to your access and use of the services offered by Website, may be retained by Website for such period as necessary, including but not limited to, for purposes such as compliance with statutory or legal obligations, tax laws and potential evidentiary purposes and for other reasonable purposes such as to implement, administer, and manage your access and use of our services, or resolution of any disputes.
To ensure a seamless experience at the Website for you and to ensure your maximum benefit and comfort, the Website may use the data collected through cookies, log file, device identifiers, location data and clear gifs information to: (a) remember information so that you will not have to re-enter it during your visit or the next time you visit the site; (b) provide custom, personalized content and information, including advertising; (c) provide and monitor the effectiveness of Services offered by Website; (d) monitor aggregate metrics such as total number of visitors, traffic, usage, and demographic patterns on the Website and its Services; (e) diagnose or fix technology problems; and (f) otherwise to plan for and enhance the service.
Website uses certain third-party analytics tools to measure traffic and usage trends for the Services. These tools collect information, which is not personal or sensitive in nature sent by the User’s device, including the web pages visited, add-ons, and other information that assists the Website in improving the Services. Such information is collected from Users in the form of anonymized logs, so that it cannot reasonably be used to identify any particular individual User.

CONFIDENTIAL:
The website aspires to takes care of all the information provided to it by its Users which may be termed as confidential. Such confidential information which is not required to be disclosed to the website, is specifically excluded from the definition of Personal Information and shall not be collected/used. The confidential information of the User shall not be disclosed or shared by the Websites, its employees, its agents or any third-party contractors including the experts either orally or in writing except for the following circumstances:

If Website believes that there is a significant/ real/ imminent threat or risk to User’s health, safety or life or to the health, safety or life of any other person or the public.
If such confidential information must be shared in accordance with the law inclusive of any investigation, Court summons, judicial proceedings etc.
To protect and defend the rights or property of the Website

CHILDREN PRIVACY POLICY: 
The Website requires that the User visiting and using the services are above 18 years of age however some service information is accessible to children under the age of 18 as well. However, it is stressed upon that website is not designed or intended to be attractive to be used by children under the age of 13 and no personal identifiable information of children below the age of 13 is collected knowingly. IF YOU ARE UNDER 13 YEARS OF AGE, PLEASE DO NOT USE ANY OF THE SERVICE PROVIDED BY THE WEBSITE AT ANY TIME OR IN ANY MANNER. If it comes to the knowledge of the concerned parent regarding sharing of any information of a child under the age of 13, contact the Website immediately. We will take appropriate steps and delete the data from the Website’s systems.

DISCLAIMER
THE WEBSITE IS NOT RESPONSIBLE FOR ANY COMMUNICATION BETWEEN THE USER AND THE THIRD-PARTY WEBSITE. THE USER IS ADVISED TO READ THE PRIVACY POLICY AND OTHER POLICIES OF THE THIRD PARTY ON THEIR WEBSITES AND THIS WEBSITE SHALL NOT BE HELD LIABLE FOR SUCH USAGE MADE ONLY BECAUSE A LINK TO THE THIRD-PARTY WEBSITE WAS PROVIDED ON THE PAGE OF THIS WEBSITE.

GRIEVANCE OFFICER
Grievance Officer Name: Ayush Sahu
Email: support@TiSness.com

The above Officer is appointed in accordance with the Information Technology Act 2000 and rules made there under. The Officer can be contacted if there are any discrepancies found on the website or there is any breach of Terms of Use, Privacy Policy or other policies or any other complaints or concerns.

To unsubscribe to any information collection, please click:`}  <Text
          style={styles.link}
          onPress={() => Linking.openURL("https://thenai.org/opt-out/")}
        >
          https://thenai.org/opt-out/
        </Text>
</Text>
              </ScrollView>
     
    </View>
  </View>
</Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  logoContainer: { alignItems: 'center', marginVertical: 30 },
  logo: { width: 60, height: 60 },
  appTitle: { fontSize: 24, color: '#E26A00', fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  inputWrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 30,
    borderColor: '#FF6600',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  countryCode: { fontSize: 16, color: '#000' },
  input: { flex: 1, paddingVertical: 10, marginLeft: 2},
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  checkboxText: { fontSize: Platform.OS === 'ios' ? 16 : 14, marginLeft: 8 },
  link: { color: 'blue' },
  getOtpButton: {
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  getOtpText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  otpSection: { alignItems: 'center', marginTop: 20 },
  otpNote: { fontSize: 16, marginBottom: 10 },
  otpInput: {
  borderWidth: 1,
  borderColor: '#ccc',
  width: 50,
  height: 50,
  borderRadius: 5,
  fontSize: 20,
  color: '#000',
  textAlign: 'center',
  marginHorizontal: 5,
  // ADD THIS:
  ...Platform.select({
    web: {
      outlineStyle: 'none' // Removes the blue border box on web click
    }
  })
},
  verifyButton: {
    backgroundColor: '#FF6600',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  verifyText: { color: '#fff', fontWeight: 'bold' },
  timerText: { marginTop: 15, fontWeight: '500' },
  timerColor: { color: '#FF6600' },
  linkText: {
    textDecorationLine: 'underline',
    color: '#007AFF',
    marginTop: 10
  },
  otpInfoText: {
    color: '#FF6600',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '75%',
    backgroundColor: '#FFEFE5',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
  },
  contentWrapper: {
    padding: 25,
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: '#4F4F4F',
    textAlign: 'center',
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  gradientBottom: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  okButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  okText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },
  countryCodeButton: { paddingVertical: 10, paddingHorizontal: 8,  // smaller horizontal padding
  marginRight: 2,          // small gap between code and input
 },
modalBox1: { width: '100%', backgroundColor: '#fff', borderRadius: 1, elevation: 10 },
dropdownContainer: {
  position: 'absolute',
  top: 55,  // adjust based on your input height
  left: 0,
  right: 0,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  zIndex: 1000,
  elevation: 5,
},
searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderBottomWidth: 1,
  borderColor: '#ccc',
  paddingHorizontal: 8,
  height: 40,
},
modalScrollArea: {
    flex: 1,
    ...Platform.select({
      web: {
        flexBasis: 0,
        overflowY: 'auto',
      }
    })
  },
searchInput: {
  flex: 1,
  paddingVertical: 5,
},
codeItem: {
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
codeText: { fontSize: 16 },

modalOverlay1: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },

closeIcon: {
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: '#fff',   // white background
  borderRadius: 0,          // smaller circle
  padding: 1,                // less padding = tighter box
  borderWidth: 1,            // black border
  borderColor: '#000',
  zIndex: 1,
},
termsBox: { 
  width: '90%', 
  height: '80%', 
  backgroundColor: '#fff', 
  borderRadius: 15, 
  padding: 20, 
  elevation: 10,
  // ADD THIS FOR WEB SCROLLING INSIDE MODAL:
  ...Platform.select({
    web: {
      display: 'flex',
      flexDirection: 'column'
    }
  })
},  termsContent: { fontSize: 14, color: '#333', lineHeight: 22, marginBottom: 10 , textAlign: 'justify',},

  modalTitle1: {
  fontSize: 18,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 12,     // ✅ gap between title and content
  marginTop: 8,
  color: '#000',
},
});

export default AstromobileFlow;
