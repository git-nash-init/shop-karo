import { useState, useEffect } from 'react';
import { Form, Button, Card, ProgressBar, Row, Col, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUser, FaTruck, FaHeart, FaCamera, FaCheckCircle, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import FormContainer from '../components/FormContainer';
import Loader from '../components/Loader';
import {
  useCompleteOnboardingMutation,
  useUploadAvatarMutation,
} from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { saveShippingAddress } from '../slices/cartSlice';

const CATEGORIES = [
  { id: 'Electronics', label: '⚡ Electronics & Gadgets' },
  { id: 'Shoes', label: '👟 Sneakers & Footwear' },
  { id: 'Clothing', label: '👕 Fashion & Apparel' },
  { id: 'Accessories', label: '⌚ Watches & Accessories' },
  { id: 'Home', label: '🏠 Home & Living' },
];

const OnboardingScreen = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [selectedCategories, setSelectedCategories] = useState(['Electronics']);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const redirect = sp.get('redirect') || '/';

  const { userInfo } = useSelector((state) => state.auth);

  const [completeOnboarding, { isLoading: isSaving }] =
    useCompleteOnboardingMutation();
  const [uploadAvatar] = useUploadAvatarMutation();

  useEffect(() => {
    if (!userInfo) {
      navigate('/login?redirect=/onboarding');
      return;
    }
    if (userInfo.name) setName(userInfo.name);
    if (userInfo.phone) setPhone(userInfo.phone);
    if (userInfo.avatarUrl) setAvatarUrl(userInfo.avatarUrl);
    if (userInfo.address) setAddress(userInfo.address);
    if (userInfo.city) setCity(userInfo.city);
    if (userInfo.postalCode) setPostalCode(userInfo.postalCode);
    if (userInfo.country) setCountry(userInfo.country);
  }, [userInfo, navigate]);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingAvatar(true);
      const res = await uploadAvatar(formData).unwrap();
      setAvatarUrl(res.image || res.url);
      toast.success('Avatar uploaded to Supabase Storage!');
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleCategory = (catId) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleComplete = async (e) => {
    if (e) e.preventDefault();

    try {
      const res = await completeOnboarding({
        name: name || userInfo.name,
        phone,
        address,
        city,
        postalCode,
        country,
        avatarUrl,
        preferences: { categories: selectedCategories },
      }).unwrap();

      dispatch(setCredentials({ ...userInfo, ...res, onboardingCompleted: true }));

      if (address && city) {
        dispatch(
          saveShippingAddress({
            address,
            city,
            postalCode,
            country,
          })
        );
      }

      toast.success('🎉 Welcome to ShopKaro! Your profile is all set.');
      navigate(redirect);
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Failed to complete onboarding');
    }
  };

  const handleSkip = () => {
    toast.info('You can complete your profile anytime from Account settings.');
    navigate(redirect);
  };

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <FormContainer>
      <div className='text-center my-4'>
        <h1 className='display-6 fw-bold' style={{ color: '#0d6efd' }}>
          Welcome to ShopKaro, {name || 'Shopper'}!
        </h1>
        <p className='text-muted'>
          Complete your account setup for express checkout and personalized recommendations.
        </p>
      </div>

      <ProgressBar
        now={progressPercent}
        label={`${progressPercent}%`}
        variant='primary'
        className='mb-4'
        style={{ height: '8px' }}
      />

      <Card className='shadow-sm p-4 border-0 mb-4' style={{ borderRadius: '16px' }}>
        {/* Step Navigation Headers */}
        <div className='d-flex justify-content-around mb-4 border-bottom pb-3'>
          <div
            className={`d-flex align-items-center ${step === 1 ? 'text-primary fw-bold' : 'text-muted'}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setStep(1)}
          >
            <FaUser className='me-2' />
            <span>1. Profile</span>
          </div>
          <div
            className={`d-flex align-items-center ${step === 2 ? 'text-primary fw-bold' : 'text-muted'}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setStep(2)}
          >
            <FaTruck className='me-2' />
            <span>2. Delivery</span>
          </div>
          <div
            className={`d-flex align-items-center ${step === 3 ? 'text-primary fw-bold' : 'text-muted'}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setStep(3)}
          >
            <FaHeart className='me-2' />
            <span>3. Interests</span>
          </div>
        </div>

        {/* STEP 1: Profile & Avatar */}
        {step === 1 && (
          <div>
            <h4 className='mb-3'>Personalize Your Profile</h4>
            <div className='text-center mb-4'>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#e9ecef',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '3px solid #0d6efd',
                  position: 'relative',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt='Avatar'
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <FaUser size={42} color='#6c757d' />
                )}
              </div>

              <div>
                <label className='btn btn-outline-primary btn-sm rounded-pill'>
                  <FaCamera className='me-1' /> {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                  <input
                    type='file'
                    hidden
                    accept='image/*'
                    onChange={handleAvatarFileChange}
                    disabled={uploadingAvatar}
                  />
                </label>
                <div className='form-text small'>Powered by Supabase Storage</div>
              </div>
            </div>

            <Form.Group className='mb-3' controlId='name'>
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter full name'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>

            <Form.Group className='mb-3' controlId='phone'>
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type='tel'
                placeholder='+91 98765 43210'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Form.Text className='text-muted'>
                Used for instant SMS dispatch & order delivery notifications.
              </Form.Text>
            </Form.Group>

            <div className='d-flex justify-content-between mt-4'>
              <Button variant='link' className='text-muted p-0' onClick={handleSkip}>
                Skip for now
              </Button>
              <Button variant='primary' onClick={() => setStep(2)}>
                Next: Delivery Address <FaArrowRight className='ms-1' />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Delivery & Shipping Address */}
        {step === 2 && (
          <div>
            <h4 className='mb-3'>Default Shipping Address</h4>
            <p className='text-muted small'>
              Setting this up now enables 1-click checkout for all future orders.
            </p>

            <Form.Group className='mb-3' controlId='address'>
              <Form.Label>Street Address</Form.Label>
              <Form.Control
                type='text'
                placeholder='House/Flat No., Street, Area'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className='mb-3' controlId='city'>
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='City'
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className='mb-3' controlId='postalCode'>
                  <Form.Label>Postal / PIN Code</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='110001'
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className='mb-3' controlId='country'>
              <Form.Label>Country</Form.Label>
              <Form.Control
                type='text'
                placeholder='Country'
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </Form.Group>

            <div className='d-flex justify-content-between mt-4'>
              <Button variant='outline-secondary' onClick={() => setStep(1)}>
                <FaArrowLeft className='me-1' /> Back
              </Button>
              <Button variant='primary' onClick={() => setStep(3)}>
                Next: Shopping Interests <FaArrowRight className='ms-1' />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Shopping Interests */}
        {step === 3 && (
          <div>
            <h4 className='mb-3'>What are you shopping for?</h4>
            <p className='text-muted small'>
              Pick categories you love so we can curate top deals for you.
            </p>

            <div className='d-flex flex-wrap gap-2 mb-4'>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <Badge
                    key={cat.id}
                    bg={isSelected ? 'primary' : 'light'}
                    text={isSelected ? 'white' : 'dark'}
                    className='p-3 fs-6 rounded-pill'
                    style={{ cursor: 'pointer', border: '1px solid #ced4da' }}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {cat.label} {isSelected && <FaCheckCircle className='ms-1' />}
                  </Badge>
                );
              })}
            </div>

            <div className='d-flex justify-content-between mt-4'>
              <Button variant='outline-secondary' onClick={() => setStep(2)}>
                <FaArrowLeft className='me-1' /> Back
              </Button>
              <Button
                variant='success'
                size='lg'
                disabled={isSaving}
                onClick={handleComplete}
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <FaCheckCircle className='me-2' /> Complete & Start Shopping
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
      {isSaving && <Loader />}
    </FormContainer>
  );
};

export default OnboardingScreen;
