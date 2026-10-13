import { type AppLocale } from '@/modules/localization/locales';

const en = {
  'tabs.home': 'Home',
  'tabs.horoscope': 'Horoscope',
  'tabs.panchang': 'Panchang',
  'tabs.rituals': 'Rituals',
  'tabs.temples': 'Temples',
  'tabs.settings': 'Settings',
  'home.title': 'Spiritual Guidance',
  'home.body':
    'Read public sections without an account. Sign-in is optional and is not required for a general Rashi horoscope.',
  'home.disclaimer':
    'A general Rashi horoscope will not ask for your birth date, birth time, or birthplace.',
  'home.policy':
    'Horoscope text, Panchang values, ritual steps, and temple details stay hidden until a reviewed source is connected.',
  'home.openSettings': 'Language and account',
  'unavailable.title': 'Not available yet',
  'unavailable.horoscope':
    'No horoscope is shown here. Choosing a Rashi only saves a preference on this device.',
  'unavailable.panchang':
    'Location-specific Panchang is not connected. This app does not calculate tithi, nakshatra, yoga, karana, or any other Panchang value.',
  'unavailable.rituals': 'Reviewed ritual guides are not loaded. No ritual steps are shown.',
  'unavailable.temples':
    'The Mataji temple directory is empty. No temple is listed until a reviewed entry is added.',
  'horoscope.pickerLabel': 'Rashi preference',
  'horoscope.labelNote':
    'Rashi names are shown in Sanskrit transliteration and English. Reviewed names in each language are not loaded yet.',
  'horoscope.noSelection': 'No Rashi selected',
  'horoscope.clear': 'Clear selection',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.languageSystem': 'Use device language',
  'settings.account': 'Account',
  'settings.accountBody':
    'Sign-in is optional. It will later keep preferences with you on another device.',
  'settings.signInUnavailable': 'Sign-in is not available in this version.',
} as const;

export type MessageKey = keyof typeof en;

export const messages: Record<AppLocale, Record<MessageKey, string>> = {
  en,
  hi: {
    'tabs.home': 'होम',
    'tabs.horoscope': 'राशिफल',
    'tabs.panchang': 'पंचांग',
    'tabs.rituals': 'विधि',
    'tabs.temples': 'मंदिर',
    'tabs.settings': 'सेटिंग्स',
    'home.title': 'आध्यात्मिक मार्गदर्शन',
    'home.body':
      'सार्वजनिक अनुभाग बिना खाते के पढ़ें। सामान्य राशिफल के लिए साइन-इन आवश्यक नहीं है।',
    'home.disclaimer': 'सामान्य राशिफल जन्म तिथि, जन्म समय या जन्मस्थान नहीं माँगेगा।',
    'home.policy':
      'राशिफल, पंचांग के मान, विधि के चरण और मंदिर का विवरण तब तक छिपे रहते हैं जब तक कोई समीक्षित स्रोत न जुड़ जाए।',
    'home.openSettings': 'भाषा और खाता',
    'unavailable.title': 'अभी उपलब्ध नहीं',
    'unavailable.horoscope':
      'यहाँ कोई राशिफल नहीं दिखाया जाता। राशि चुनना केवल इस डिवाइस पर एक पसंद सहेजता है।',
    'unavailable.panchang':
      'स्थान के अनुसार पंचांग जुड़ा नहीं है। यह ऐप तिथि, नक्षत्र, योग, करण या कोई अन्य पंचांग मान गणना नहीं करता।',
    'unavailable.rituals':
      'समीक्षित विधि मार्गदर्शिकाएँ लोड नहीं हैं। विधि के कोई चरण नहीं दिखाए जाते।',
    'unavailable.temples':
      'माताजी मंदिर निर्देशिका खाली है। समीक्षित प्रविष्टि जुड़ने तक कोई मंदिर सूचीबद्ध नहीं है।',
    'horoscope.pickerLabel': 'राशि की पसंद',
    'horoscope.labelNote':
      'राशि के नाम संस्कृत लिप्यंतरण और अंग्रेज़ी में हैं। प्रत्येक भाषा के समीक्षित नाम अभी लोड नहीं हैं।',
    'horoscope.noSelection': 'कोई राशि चयनित नहीं',
    'horoscope.clear': 'चयन हटाएँ',
    'settings.title': 'सेटिंग्स',
    'settings.language': 'भाषा',
    'settings.languageSystem': 'डिवाइस की भाषा का उपयोग करें',
    'settings.account': 'खाता',
    'settings.accountBody':
      'साइन-इन वैकल्पिक है। बाद में यह पसंदों को दूसरे डिवाइस पर आपके साथ रखेगा।',
    'settings.signInUnavailable': 'इस संस्करण में साइन-इन उपलब्ध नहीं है।',
  },
  gu: {
    'tabs.home': 'હોમ',
    'tabs.horoscope': 'રાશિફળ',
    'tabs.panchang': 'પંચાંગ',
    'tabs.rituals': 'વિધિ',
    'tabs.temples': 'મંદિર',
    'tabs.settings': 'સેટિંગ્સ',
    'home.title': 'આધ્યાત્મિક માર્ગદર્શન',
    'home.body': 'જાહેર વિભાગો ખાતા વગર વાંચો. સામાન્ય રાશિફળ માટે સાઇન-ઇન જરૂરી નથી.',
    'home.disclaimer': 'સામાન્ય રાશિફળ જન્મ તારીખ, જન્મ સમય અથવા જન્મસ્થળ પૂછશે નહીં.',
    'home.policy':
      'રાશિફળ, પંચાંગના મૂલ્યો, વિધિના પગલાં અને મંદિરની વિગતો સમીક્ષિત સ્રોત જોડાય ત્યાં સુધી છુપાયેલા રહે છે.',
    'home.openSettings': 'ભાષા અને ખાતું',
    'unavailable.title': 'હજુ ઉપલબ્ધ નથી',
    'unavailable.horoscope':
      'અહીં કોઈ રાશિફળ દેખાતું નથી. રાશિ પસંદ કરવી ફક્ત આ ડિવાઇસ પર પસંદગી સાચવે છે.',
    'unavailable.panchang':
      'સ્થાન મુજબનું પંચાંગ જોડાયેલું નથી. આ ઍપ તિથિ, નક્ષત્ર, યોગ, કરણ અથવા અન્ય કોઈ પંચાંગ મૂલ્યની ગણતરી કરતી નથી.',
    'unavailable.rituals': 'સમીક્ષિત વિધિ માર્ગદર્શિકાઓ લોડ થઈ નથી. વિધિના કોઈ પગલાં દેખાતા નથી.',
    'unavailable.temples':
      'માતાજી મંદિર નિર્દેશિકા ખાલી છે. સમીક્ષિત નોંધ ઉમેરાય ત્યાં સુધી કોઈ મંદિર યાદીમાં નથી.',
    'horoscope.pickerLabel': 'રાશિની પસંદગી',
    'horoscope.labelNote':
      'રાશિના નામ સંસ્કૃત લિપ્યંતર અને અંગ્રેજીમાં છે. દરેક ભાષાના સમીક્ષિત નામ હજુ લોડ થયા નથી.',
    'horoscope.noSelection': 'કોઈ રાશિ પસંદ નથી',
    'horoscope.clear': 'પસંદગી દૂર કરો',
    'settings.title': 'સેટિંગ્સ',
    'settings.language': 'ભાષા',
    'settings.languageSystem': 'ડિવાઇસની ભાષા વાપરો',
    'settings.account': 'ખાતું',
    'settings.accountBody':
      'સાઇન-ઇન વૈકલ્પિક છે. પછી તે પસંદગીઓને બીજા ડિવાઇસ પર તમારી સાથે રાખશે.',
    'settings.signInUnavailable': 'આ આવૃત્તિમાં સાઇન-ઇન ઉપલબ્ધ નથી.',
  },
  ta: {
    'tabs.home': 'முகப்பு',
    'tabs.horoscope': 'ராசிபலன்',
    'tabs.panchang': 'பஞ்சாங்கம்',
    'tabs.rituals': 'சடங்குகள்',
    'tabs.temples': 'கோயில்கள்',
    'tabs.settings': 'அமைப்புகள்',
    'home.title': 'ஆன்மிக வழிகாட்டுதல்',
    'home.body':
      'பொதுப் பகுதிகளை கணக்கு இல்லாமல் படிக்கலாம். பொதுவான ராசிபலனுக்கு உள்நுழைவு தேவையில்லை.',
    'home.disclaimer':
      'பொதுவான ராசிபலன் பிறந்த தேதி, பிறந்த நேரம் அல்லது பிறந்த இடத்தைக் கேட்காது.',
    'home.policy':
      'ராசிபலன், பஞ்சாங்க மதிப்புகள், சடங்கு படிகள் மற்றும் கோயில் விவரங்கள் மதிப்பாய்வு செய்யப்பட்ட மூலம் இணையும் வரை காட்டப்படாது.',
    'home.openSettings': 'மொழி மற்றும் கணக்கு',
    'unavailable.title': 'இன்னும் கிடைக்கவில்லை',
    'unavailable.horoscope':
      'இங்கு ராசிபலன் காட்டப்படவில்லை. ராசியைத் தேர்ந்தெடுப்பது இந்தச் சாதனத்தில் ஒரு விருப்பத்தை மட்டும் சேமிக்கிறது.',
    'unavailable.panchang':
      'இடத்திற்கேற்ற பஞ்சாங்கம் இணைக்கப்படவில்லை. இந்தச் செயலி திதி, நட்சத்திரம், யோகம், கரணம் அல்லது வேறு பஞ்சாங்க மதிப்பைக் கணக்கிடாது.',
    'unavailable.rituals':
      'மதிப்பாய்வு செய்யப்பட்ட சடங்கு வழிகாட்டிகள் ஏற்றப்படவில்லை. சடங்கு படிகள் எதுவும் காட்டப்படவில்லை.',
    'unavailable.temples':
      'மாதாஜி கோயில் பட்டியல் காலியாக உள்ளது. மதிப்பாய்வு செய்யப்பட்ட பதிவு சேரும் வரை எந்தக் கோயிலும் பட்டியலிடப்படவில்லை.',
    'horoscope.pickerLabel': 'ராசி விருப்பம்',
    'horoscope.labelNote':
      'ராசி பெயர்கள் சமஸ்கிருத ஒலிபெயர்ப்பிலும் ஆங்கிலத்திலும் உள்ளன. ஒவ்வொரு மொழியின் மதிப்பாய்வு செய்யப்பட்ட பெயர்களும் இன்னும் ஏற்றப்படவில்லை.',
    'horoscope.noSelection': 'ராசி தேர்ந்தெடுக்கப்படவில்லை',
    'horoscope.clear': 'தேர்வை நீக்கு',
    'settings.title': 'அமைப்புகள்',
    'settings.language': 'மொழி',
    'settings.languageSystem': 'சாதன மொழியைப் பயன்படுத்து',
    'settings.account': 'கணக்கு',
    'settings.accountBody':
      'உள்நுழைவு கட்டாயமல்ல. பின்னர் இது உங்கள் விருப்பங்களை மற்றொரு சாதனத்தில் வைத்திருக்கும்.',
    'settings.signInUnavailable': 'இந்தப் பதிப்பில் உள்நுழைவு இல்லை.',
  },
  ml: {
    'tabs.home': 'ഹോം',
    'tabs.horoscope': 'രാശിഫലം',
    'tabs.panchang': 'പഞ്ചാംഗം',
    'tabs.rituals': 'അനുഷ്ഠാനങ്ങൾ',
    'tabs.temples': 'ക്ഷേത്രങ്ങൾ',
    'tabs.settings': 'ക്രമീകരണങ്ങൾ',
    'home.title': 'ആത്മീയ മാർഗനിർദേശം',
    'home.body':
      'പൊതു വിഭാഗങ്ങൾ അക്കൗണ്ട് ഇല്ലാതെ വായിക്കാം. പൊതുവായ രാശിഫലത്തിന് സൈൻ-ഇൻ ആവശ്യമില്ല.',
    'home.disclaimer': 'പൊതുവായ രാശിഫലം ജനനത്തീയതി, ജനനസമയം, ജനനസ്ഥലം എന്നിവ ചോദിക്കില്ല.',
    'home.policy':
      'രാശിഫലം, പഞ്ചാംഗ മൂല്യങ്ങൾ, അനുഷ്ഠാന ഘട്ടങ്ങൾ, ക്ഷേത്ര വിവരങ്ങൾ എന്നിവ അവലോകനം ചെയ്ത ഉറവിടം ബന്ധിപ്പിക്കുന്നതുവരെ കാണിക്കില്ല.',
    'home.openSettings': 'ഭാഷയും അക്കൗണ്ടും',
    'unavailable.title': 'ഇതുവരെ ലഭ്യമല്ല',
    'unavailable.horoscope':
      'ഇവിടെ രാശിഫലം കാണിക്കുന്നില്ല. രാശി തിരഞ്ഞെടുക്കുന്നത് ഈ ഉപകരണത്തിലെ മുൻഗണന മാത്രം സൂക്ഷിക്കുന്നു.',
    'unavailable.panchang':
      'സ്ഥലത്തിനനുസരിച്ചുള്ള പഞ്ചാംഗം ബന്ധിപ്പിച്ചിട്ടില്ല. ഈ ആപ്പ് തിഥി, നക്ഷത്രം, യോഗം, കരണം അല്ലെങ്കിൽ മറ്റ് പഞ്ചാംഗ മൂല്യം കണക്കാക്കുന്നില്ല.',
    'unavailable.rituals':
      'അവലോകനം ചെയ്ത അനുഷ്ഠാന മാർഗ്ഗനിർദേശങ്ങൾ ലോഡ് ചെയ്തിട്ടില്ല. അനുഷ്ഠാന ഘട്ടങ്ങളൊന്നും കാണിക്കുന്നില്ല.',
    'unavailable.temples':
      'മാതാജി ക്ഷേത്ര ഡയറക്ടറി ശൂന്യമാണ്. അവലോകനം ചെയ്ത എൻട്രി ചേർക്കുന്നതുവരെ ഒരു ക്ഷേത്രവും പട്ടികയിലില്ല.',
    'horoscope.pickerLabel': 'രാശി മുൻഗണന',
    'horoscope.labelNote':
      'രാശി പേരുകൾ സംസ്കൃത ലിപ്യന്തരണത്തിലും ഇംഗ്ലീഷിലുമാണ്. ഓരോ ഭാഷയിലെയും അവലോകനം ചെയ്ത പേരുകൾ ഇതുവരെ ലോഡ് ചെയ്തിട്ടില്ല.',
    'horoscope.noSelection': 'രാശി തിരഞ്ഞെടുത്തിട്ടില്ല',
    'horoscope.clear': 'തിരഞ്ഞെടുപ്പ് മാറ്റുക',
    'settings.title': 'ക്രമീകരണങ്ങൾ',
    'settings.language': 'ഭാഷ',
    'settings.languageSystem': 'ഉപകരണ ഭാഷ ഉപയോഗിക്കുക',
    'settings.account': 'അക്കൗണ്ട്',
    'settings.accountBody':
      'സൈൻ-ഇൻ ഐച്ഛികമാണ്. പിന്നീട് ഇത് മുൻഗണനകൾ മറ്റൊരു ഉപകരണത്തിൽ നിങ്ങളോടൊപ്പം സൂക്ഷിക്കും.',
    'settings.signInUnavailable': 'ഈ പതിപ്പിൽ സൈൻ-ഇൻ ലഭ്യമല്ല.',
  },
  mr: {
    'tabs.home': 'मुख्यपृष्ठ',
    'tabs.horoscope': 'राशीभविष्य',
    'tabs.panchang': 'पंचांग',
    'tabs.rituals': 'विधी',
    'tabs.temples': 'मंदिरे',
    'tabs.settings': 'सेटिंग्ज',
    'home.title': 'आध्यात्मिक मार्गदर्शन',
    'home.body': 'सार्वजनिक विभाग खात्याशिवाय वाचा. सामान्य राशीभविष्यासाठी साइन-इन आवश्यक नाही.',
    'home.disclaimer': 'सामान्य राशीभविष्य जन्मतारीख, जन्मवेळ किंवा जन्मस्थळ विचारणार नाही.',
    'home.policy':
      'राशीभविष्य, पंचांगाची मूल्ये, विधीचे टप्पे आणि मंदिराचा तपशील समीक्षित स्रोत जोडेपर्यंत दिसत नाहीत.',
    'home.openSettings': 'भाषा आणि खाते',
    'unavailable.title': 'अद्याप उपलब्ध नाही',
    'unavailable.horoscope':
      'येथे राशीभविष्य दाखवले जात नाही. राशी निवडणे फक्त या डिव्हाइसवर पसंती जतन करते.',
    'unavailable.panchang':
      'स्थानानुसार पंचांग जोडलेले नाही. हे अॅप तिथी, नक्षत्र, योग, करण किंवा इतर पंचांग मूल्य मोजत नाही.',
    'unavailable.rituals':
      'समीक्षित विधी मार्गदर्शक लोड केलेले नाहीत. विधीचे कोणतेही टप्पे दाखवले जात नाहीत.',
    'unavailable.temples':
      'माताजी मंदिर निर्देशिका रिकामी आहे. समीक्षित नोंद जोडेपर्यंत कोणतेही मंदिर सूचीबद्ध नाही.',
    'horoscope.pickerLabel': 'राशीची पसंती',
    'horoscope.labelNote':
      'राशींची नावे संस्कृत लिप्यंतर आणि इंग्रजीत आहेत. प्रत्येक भाषेतील समीक्षित नावे अद्याप लोड झालेली नाहीत.',
    'horoscope.noSelection': 'कोणतीही राशी निवडलेली नाही',
    'horoscope.clear': 'निवड काढा',
    'settings.title': 'सेटिंग्ज',
    'settings.language': 'भाषा',
    'settings.languageSystem': 'डिव्हाइसची भाषा वापरा',
    'settings.account': 'खाते',
    'settings.accountBody':
      'साइन-इन ऐच्छिक आहे. नंतर ते पसंती दुसऱ्या डिव्हाइसवर तुमच्यासोबत ठेवेल.',
    'settings.signInUnavailable': 'या आवृत्तीत साइन-इन उपलब्ध नाही.',
  },
  kn: {
    'tabs.home': 'ಮುಖಪುಟ',
    'tabs.horoscope': 'ರಾಶಿಫಲ',
    'tabs.panchang': 'ಪಂಚಾಂಗ',
    'tabs.rituals': 'ಆಚರಣೆಗಳು',
    'tabs.temples': 'ದೇವಾಲಯಗಳು',
    'tabs.settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'home.title': 'ಆಧ್ಯಾತ್ಮಿಕ ಮಾರ್ಗದರ್ಶನ',
    'home.body': 'ಸಾರ್ವಜನಿಕ ವಿಭಾಗಗಳನ್ನು ಖಾತೆ ಇಲ್ಲದೆ ಓದಿ. ಸಾಮಾನ್ಯ ರಾಶಿಫಲಕ್ಕೆ ಸೈನ್-ಇನ್ ಅಗತ್ಯವಿಲ್ಲ.',
    'home.disclaimer': 'ಸಾಮಾನ್ಯ ರಾಶಿಫಲ ಜನ್ಮದಿನಾಂಕ, ಜನ್ಮ ಸಮಯ ಅಥವಾ ಜನ್ಮಸ್ಥಳವನ್ನು ಕೇಳುವುದಿಲ್ಲ.',
    'home.policy':
      'ರಾಶಿಫಲ, ಪಂಚಾಂಗ ಮೌಲ್ಯಗಳು, ಆಚರಣೆಯ ಹಂತಗಳು ಮತ್ತು ದೇವಾಲಯದ ವಿವರಗಳು ಪರಿಶೀಲಿತ ಮೂಲ ಸೇರುವವರೆಗೆ ತೋರಿಸಲಾಗುವುದಿಲ್ಲ.',
    'home.openSettings': 'ಭಾಷೆ ಮತ್ತು ಖಾತೆ',
    'unavailable.title': 'ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ',
    'unavailable.horoscope':
      'ಇಲ್ಲಿ ರಾಶಿಫಲ ತೋರಿಸಲಾಗುವುದಿಲ್ಲ. ರಾಶಿ ಆಯ್ಕೆ ಈ ಸಾಧನದಲ್ಲಿ ಆದ್ಯತೆಯನ್ನು ಮಾತ್ರ ಉಳಿಸುತ್ತದೆ.',
    'unavailable.panchang':
      'ಸ್ಥಳಕ್ಕೆ ತಕ್ಕ ಪಂಚಾಂಗ ಸಂಪರ್ಕವಾಗಿಲ್ಲ. ಈ ಅಪ್ಲಿಕೇಶನ್ ತಿಥಿ, ನಕ್ಷತ್ರ, ಯೋಗ, ಕರಣ ಅಥವಾ ಬೇರೆ ಪಂಚಾಂಗ ಮೌಲ್ಯವನ್ನು ಲೆಕ್ಕ ಹಾಕುವುದಿಲ್ಲ.',
    'unavailable.rituals':
      'ಪರಿಶೀಲಿತ ಆಚರಣೆ ಮಾರ್ಗದರ್ಶಿಗಳು ಲೋಡ್ ಆಗಿಲ್ಲ. ಆಚರಣೆಯ ಯಾವ ಹಂತಗಳೂ ತೋರಿಸಲಾಗುವುದಿಲ್ಲ.',
    'unavailable.temples':
      'ಮಾತಾಜಿ ದೇವಾಲಯ ಡೈರೆಕ್ಟರಿ ಖಾಲಿಯಾಗಿದೆ. ಪರಿಶೀಲಿತ ನಮೂದು ಸೇರುವವರೆಗೆ ಯಾವ ದೇವಾಲಯವೂ ಪಟ್ಟಿಯಲ್ಲಿಲ್ಲ.',
    'horoscope.pickerLabel': 'ರಾಶಿ ಆದ್ಯತೆ',
    'horoscope.labelNote':
      'ರಾಶಿ ಹೆಸರುಗಳು ಸಂಸ್ಕೃತ ಲಿಪ್ಯಂತರ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿವೆ. ಪ್ರತಿ ಭಾಷೆಯ ಪರಿಶೀಲಿತ ಹೆಸರುಗಳು ಇನ್ನೂ ಲೋಡ್ ಆಗಿಲ್ಲ.',
    'horoscope.noSelection': 'ಯಾವ ರಾಶಿಯೂ ಆಯ್ಕೆಯಾಗಿಲ್ಲ',
    'horoscope.clear': 'ಆಯ್ಕೆ ತೆಗೆದುಹಾಕಿ',
    'settings.title': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'settings.language': 'ಭಾಷೆ',
    'settings.languageSystem': 'ಸಾಧನದ ಭಾಷೆಯನ್ನು ಬಳಸಿ',
    'settings.account': 'ಖಾತೆ',
    'settings.accountBody':
      'ಸೈನ್-ಇನ್ ಐಚ್ಛಿಕ. ನಂತರ ಇದು ಆದ್ಯತೆಗಳನ್ನು ಇನ್ನೊಂದು ಸಾಧನದಲ್ಲಿ ನಿಮ್ಮೊಂದಿಗೆ ಇಡುತ್ತದೆ.',
    'settings.signInUnavailable': 'ಈ ಆವೃತ್ತಿಯಲ್ಲಿ ಸೈನ್-ಇನ್ ಲಭ್ಯವಿಲ್ಲ.',
  },
  te: {
    'tabs.home': 'హోమ్',
    'tabs.horoscope': 'రాశిఫలం',
    'tabs.panchang': 'పంచాంగం',
    'tabs.rituals': 'ఆచారాలు',
    'tabs.temples': 'ఆలయాలు',
    'tabs.settings': 'సెట్టింగ్‌లు',
    'home.title': 'ఆధ్యాత్మిక మార్గదర్శకం',
    'home.body': 'బహిరంగ విభాగాలను ఖాతా లేకుండా చదవండి. సాధారణ రాశిఫలానికి సైన్-ఇన్ అవసరం లేదు.',
    'home.disclaimer': 'సాధారణ రాశిఫలం పుట్టిన తేదీ, పుట్టిన సమయం లేదా పుట్టిన స్థలాన్ని అడగదు.',
    'home.policy':
      'రాశిఫలం, పంచాంగ విలువలు, ఆచార దశలు మరియు ఆలయ వివరాలు సమీక్షించిన మూలం కలిసే వరకు చూపించబడవు.',
    'home.openSettings': 'భాష మరియు ఖాతా',
    'unavailable.title': 'ఇంకా అందుబాటులో లేదు',
    'unavailable.horoscope':
      'ఇక్కడ రాశిఫలం చూపించబడదు. రాశిని ఎంచుకోవడం ఈ పరికరంలో ప్రాధాన్యతను మాత్రమే సేవ్ చేస్తుంది.',
    'unavailable.panchang':
      'ప్రాంతానికి సరిపడే పంచాంగం కనెక్ట్ కాలేదు. ఈ యాప్ తిథి, నక్షత్రం, యోగం, కరణం లేదా ఇతర పంచాంగ విలువను లెక్కించదు.',
    'unavailable.rituals': 'సమీక్షించిన ఆచార మార్గదర్శకాలు లోడ్ కాలేదు. ఆచార దశలు ఏవీ చూపించబడవు.',
    'unavailable.temples':
      'మాతాజీ ఆలయ డైరెక్టరీ ఖాళీగా ఉంది. సమీక్షించిన నమోదు చేరే వరకు ఏ ఆలయం జాబితాలో లేదు.',
    'horoscope.pickerLabel': 'రాశి ప్రాధాన్యత',
    'horoscope.labelNote':
      'రాశి పేర్లు సంస్కృత లిప్యంతరం మరియు ఇంగ్లీషులో ఉన్నాయి. ప్రతి భాషలోని సమీక్షించిన పేర్లు ఇంకా లోడ్ కాలేదు.',
    'horoscope.noSelection': 'రాశి ఎంచుకోలేదు',
    'horoscope.clear': 'ఎంపిక తొలగించు',
    'settings.title': 'సెట్టింగ్‌లు',
    'settings.language': 'భాష',
    'settings.languageSystem': 'పరికర భాషను ఉపయోగించు',
    'settings.account': 'ఖాతా',
    'settings.accountBody':
      'సైన్-ఇన్ ఐచ్ఛికం. తర్వాత ఇది ప్రాధాన్యతలను మరో పరికరంలో మీతో ఉంచుతుంది.',
    'settings.signInUnavailable': 'ఈ వెర్షన్‌లో సైన్-ఇన్ అందుబాటులో లేదు.',
  },
  bn: {
    'tabs.home': 'হোম',
    'tabs.horoscope': 'রাশিফল',
    'tabs.panchang': 'পঞ্জিকা',
    'tabs.rituals': 'অনুষ্ঠান',
    'tabs.temples': 'মন্দির',
    'tabs.settings': 'সেটিংস',
    'home.title': 'আধ্যাত্মিক নির্দেশনা',
    'home.body': 'সর্বজনীন অংশ অ্যাকাউন্ট ছাড়াই পড়ুন। সাধারণ রাশিফলের জন্য সাইন-ইন লাগে না।',
    'home.disclaimer': 'সাধারণ রাশিফল জন্মতারিখ, জন্মসময় বা জন্মস্থান জিজ্ঞাসা করবে না।',
    'home.policy':
      'রাশিফল, পঞ্জিকার মান, অনুষ্ঠানের ধাপ এবং মন্দিরের বিবরণ পর্যালোচিত উৎস যুক্ত না হওয়া পর্যন্ত দেখানো হয় না।',
    'home.openSettings': 'ভাষা ও অ্যাকাউন্ট',
    'unavailable.title': 'এখনও উপলব্ধ নয়',
    'unavailable.horoscope':
      'এখানে কোনো রাশিফল দেখানো হয় না। রাশি বেছে নেওয়া শুধু এই ডিভাইসে একটি পছন্দ সেভ করে।',
    'unavailable.panchang':
      'স্থানভিত্তিক পঞ্জিকা যুক্ত নয়। এই অ্যাপ তিথি, নক্ষত্র, যোগ, করণ বা অন্য কোনো পঞ্জিকার মান গণনা করে না।',
    'unavailable.rituals':
      'পর্যালোচিত অনুষ্ঠান নির্দেশিকা লোড হয়নি। অনুষ্ঠানের কোনো ধাপ দেখানো হয় না।',
    'unavailable.temples':
      'মাতাজি মন্দির নির্দেশিকা খালি। পর্যালোচিত এন্ট্রি যোগ না হওয়া পর্যন্ত কোনো মন্দির তালিকাভুক্ত নয়।',
    'horoscope.pickerLabel': 'রাশির পছন্দ',
    'horoscope.labelNote':
      'রাশির নাম সংস্কৃত লিপ্যন্তর ও ইংরেজিতে দেখানো হচ্ছে। প্রতিটি ভাষার পর্যালোচিত নাম এখনও লোড হয়নি।',
    'horoscope.noSelection': 'কোনো রাশি নির্বাচিত নয়',
    'horoscope.clear': 'নির্বাচন সরান',
    'settings.title': 'সেটিংস',
    'settings.language': 'ভাষা',
    'settings.languageSystem': 'ডিভাইসের ভাষা ব্যবহার করুন',
    'settings.account': 'অ্যাকাউন্ট',
    'settings.accountBody': 'সাইন-ইন ঐচ্ছিক। পরে এটি পছন্দ অন্য ডিভাইসে আপনার সাথে রাখবে।',
    'settings.signInUnavailable': 'এই সংস্করণে সাইন-ইন নেই।',
  },
  pa: {
    'tabs.home': 'ਹੋਮ',
    'tabs.horoscope': 'ਰਾਸ਼ੀਫਲ',
    'tabs.panchang': 'ਪੰਚਾਂਗ',
    'tabs.rituals': 'ਵਿਧੀ',
    'tabs.temples': 'ਮੰਦਰ',
    'tabs.settings': 'ਸੈਟਿੰਗਾਂ',
    'home.title': 'ਆਧਿਆਤਮਿਕ ਮਾਰਗਦਰਸ਼ਨ',
    'home.body': 'ਜਨਤਕ ਭਾਗ ਬਿਨਾਂ ਖਾਤੇ ਪੜ੍ਹੋ। ਆਮ ਰਾਸ਼ੀਫਲ ਲਈ ਸਾਈਨ-ਇਨ ਲੋੜੀਂਦਾ ਨਹੀਂ।',
    'home.disclaimer': 'ਆਮ ਰਾਸ਼ੀਫਲ ਜਨਮ ਤਾਰੀਖ, ਜਨਮ ਸਮਾਂ ਜਾਂ ਜਨਮ ਸਥਾਨ ਨਹੀਂ ਪੁੱਛੇਗਾ।',
    'home.policy':
      'ਰਾਸ਼ੀਫਲ, ਪੰਚਾਂਗ ਦੇ ਮੁੱਲ, ਵਿਧੀ ਦੇ ਪੜਾਅ ਅਤੇ ਮੰਦਰ ਦਾ ਵੇਰਵਾ ਉਦੋਂ ਤੱਕ ਨਹੀਂ ਦਿਖਾਇਆ ਜਾਂਦਾ ਜਦੋਂ ਤੱਕ ਕੋਈ ਸਮੀਖਿਆ ਕੀਤਾ ਸਰੋਤ ਨਾ ਜੁੜੇ।',
    'home.openSettings': 'ਭਾਸ਼ਾ ਅਤੇ ਖਾਤਾ',
    'unavailable.title': 'ਅਜੇ ਉਪਲਬਧ ਨਹੀਂ',
    'unavailable.horoscope':
      'ਇੱਥੇ ਕੋਈ ਰਾਸ਼ੀਫਲ ਨਹੀਂ ਦਿਖਾਇਆ ਜਾਂਦਾ। ਰਾਸ਼ੀ ਚੁਣਨਾ ਸਿਰਫ਼ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਪਸੰਦ ਸੰਭਾਲਦਾ ਹੈ।',
    'unavailable.panchang':
      'ਥਾਂ ਮੁਤਾਬਕ ਪੰਚਾਂਗ ਜੁੜਿਆ ਨਹੀਂ ਹੈ। ਇਹ ਐਪ ਤਿਥੀ, ਨਛੱਤਰ, ਯੋਗ, ਕਰਨ ਜਾਂ ਕੋਈ ਹੋਰ ਪੰਚਾਂਗ ਮੁੱਲ ਗਿਣਦੀ ਨਹੀਂ।',
    'unavailable.rituals':
      'ਸਮੀਖਿਆ ਕੀਤੀਆਂ ਵਿਧੀ ਗਾਈਡਾਂ ਲੋਡ ਨਹੀਂ ਹੋਈਆਂ। ਵਿਧੀ ਦਾ ਕੋਈ ਪੜਾਅ ਨਹੀਂ ਦਿਖਾਇਆ ਜਾਂਦਾ।',
    'unavailable.temples':
      'ਮਾਤਾ ਜੀ ਮੰਦਰ ਡਾਇਰੈਕਟਰੀ ਖਾਲੀ ਹੈ। ਸਮੀਖਿਆ ਕੀਤੀ ਐਂਟਰੀ ਜੁੜਨ ਤੱਕ ਕੋਈ ਮੰਦਰ ਸੂਚੀ ਵਿੱਚ ਨਹੀਂ।',
    'horoscope.pickerLabel': 'ਰਾਸ਼ੀ ਦੀ ਪਸੰਦ',
    'horoscope.labelNote':
      'ਰਾਸ਼ੀ ਦੇ ਨਾਮ ਸੰਸਕ੍ਰਿਤ ਲਿਪੀਅੰਤਰ ਅਤੇ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹਨ। ਹਰ ਭਾਸ਼ਾ ਦੇ ਸਮੀਖਿਆ ਕੀਤੇ ਨਾਮ ਅਜੇ ਲੋਡ ਨਹੀਂ ਹੋਏ।',
    'horoscope.noSelection': 'ਕੋਈ ਰਾਸ਼ੀ ਨਹੀਂ ਚੁਣੀ',
    'horoscope.clear': 'ਚੋਣ ਹਟਾਓ',
    'settings.title': 'ਸੈਟਿੰਗਾਂ',
    'settings.language': 'ਭਾਸ਼ਾ',
    'settings.languageSystem': 'ਡਿਵਾਈਸ ਦੀ ਭਾਸ਼ਾ ਵਰਤੋ',
    'settings.account': 'ਖਾਤਾ',
    'settings.accountBody':
      'ਸਾਈਨ-ਇਨ ਵਿਕਲਪਿਕ ਹੈ। ਬਾਅਦ ਵਿੱਚ ਇਹ ਪਸੰਦਾਂ ਨੂੰ ਦੂਜੇ ਡਿਵਾਈਸ ਉੱਤੇ ਤੁਹਾਡੇ ਨਾਲ ਰੱਖੇਗਾ।',
    'settings.signInUnavailable': 'ਇਸ ਵਰਜ਼ਨ ਵਿੱਚ ਸਾਈਨ-ਇਨ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।',
  },
};

export function translate(locale: AppLocale, key: MessageKey): string {
  return messages[locale][key];
}
