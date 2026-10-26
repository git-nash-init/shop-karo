import React, { useEffect, useState } from 'react';
import { Table, Form, Button, Row, Col, Badge, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaTimes, FaCamera, FaUser, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Message from '../components/Message';
import Loader from '../components/Loader';
import {
  useProfileMutation,
  useUploadAvatarMutation,
} from '../slices/usersApiSlice';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { Link } from 'react-router-dom';

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();

  const [updateProfile, { isLoading: loadingUpdateProfile }] =
    useProfileMutation();
  const [uploadAvatar] = useUploadAvatarMutation();

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name || '');
      setEmail(userInfo.email || '');
      setPhone(userInfo.phone || '');
      setAvatarUrl(userInfo.avatarUrl || '');
      setAddress(userInfo.address || '');
      setCity(userInfo.city || '');
      setPostalCode(userInfo.postalCode || '');
      setCountry(userInfo.country || '');
    }
  }, [userInfo]);

  const dispatch = useDispatch();

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingAvatar(true);
      const res = await uploadAvatar(formData).unwrap();
      const uploadedUrl = res.image || res.url;
      setAvatarUrl(uploadedUrl);

      // Save directly to profile
      const updated = await updateProfile({ avatarUrl: uploadedUrl }).unwrap();
      dispatch(setCredentials({ ...userInfo, ...updated }));
      toast.success('Avatar updated via Supabase Storage!');
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const payload = {
        name,
        email,
        phone,
        address,
        city,
        postalCode,
        country,
        avatarUrl,
      };
      if (password) payload.password = password;

      const res = await updateProfile(payload).unwrap();
      dispatch(setCredentials({ ...userInfo, ...res }));
      toast.success('Profile updated successfully in Supabase!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <Row>
      <Col md={4}>
        <Card className='p-3 mb-4 shadow-sm border-0' style={{ borderRadius: '12px' }}>
          <div className='d-flex justify-content-between align-items-center mb-3'>
            <h3 className='mb-0'>User Profile</h3>
            {userInfo?.onboardingCompleted ? (
              <Badge bg='success' className='p-2'>
                <FaCheckCircle className='me-1' /> Profile Verified
              </Badge>
            ) : (
              <Badge bg='warning' text='dark' as={Link} to='/onboarding' className='p-2 text-decoration-none'>
                Complete Setup →
              </Badge>
            )}
          </div>

          {/* Avatar Section */}
          <div className='text-center mb-3'>
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: '#e9ecef',
                margin: '0 auto 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '3px solid #0d6efd',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt='Avatar'
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <FaUser size={36} color='#6c757d' />
              )}
            </div>

            <label className='btn btn-sm btn-outline-primary rounded-pill'>
              <FaCamera className='me-1' /> {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
              <input
                type='file'
                hidden
                accept='image/*'
                onChange={handleAvatarFileChange}
                disabled={uploadingAvatar}
              />
            </label>
            <div className='text-muted small mt-1'>Supabase Storage</div>
          </div>

          <Form onSubmit={submitHandler}>
            <Form.Group className='my-2' controlId='name'>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter name'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>

            <Form.Group className='my-2' controlId='email'>
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type='email'
                placeholder='Enter email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <Form.Group className='my-2' controlId='phone'>
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type='tel'
                placeholder='Enter phone number'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Form.Group>

            <h5 className='mt-3 mb-2 text-primary'>Shipping Defaults</h5>

            <Form.Group className='my-2' controlId='address'>
              <Form.Label>Address</Form.Label>
              <Form.Control
                type='text'
                placeholder='Street address'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Form.Group>

            <Row>
              <Col sm={6}>
                <Form.Group className='my-2' controlId='city'>
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='City'
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group className='my-2' controlId='postalCode'>
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='PIN code'
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className='my-2' controlId='country'>
              <Form.Label>Country</Form.Label>
              <Form.Control
                type='text'
                placeholder='Country'
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </Form.Group>

            <h5 className='mt-3 mb-2 text-muted'>Change Password (Optional)</h5>

            <Form.Group className='my-2' controlId='password'>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type='password'
                placeholder='Leave blank to keep same'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            <Form.Group className='my-2' controlId='confirmPassword'>
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type='password'
                placeholder='Confirm new password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Form.Group>

            <Button type='submit' variant='primary' className='w-100 mt-3'>
              Update Profile
            </Button>
            {loadingUpdateProfile && <Loader />}
          </Form>
        </Card>
      </Col>

      <Col md={8}>
        <h2>My Orders</h2>
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>
            {error?.data?.message || error.error}
          </Message>
        ) : (
          <Table striped hover responsive className='table-sm'>
            <thead>
              <tr>
                <th>ID</th>
                <th>DATE</th>
                <th>TOTAL</th>
                <th>PAID</th>
                <th>DELIVERED</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id.substring(0, 8)}...</td>
                  <td>{order.createdAt ? order.createdAt.substring(0, 10) : ''}</td>
                  <td>${order.totalPrice}</td>
                  <td>
                    {order.isPaid ? (
                      order.paidAt ? order.paidAt.substring(0, 10) : 'Yes'
                    ) : (
                      <FaTimes style={{ color: 'red' }} />
                    )}
                  </td>
                  <td>
                    {order.isDelivered ? (
                      order.deliveredAt ? order.deliveredAt.substring(0, 10) : 'Yes'
                    ) : (
                      <FaTimes style={{ color: 'red' }} />
                    )}
                  </td>
                  <td>
                    <Button
                      as={Link}
                      to={`/order/${order._id}`}
                      className='btn-sm'
                      variant='light'
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Col>
    </Row>
  );
};

export default ProfileScreen;
