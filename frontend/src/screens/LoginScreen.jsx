import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Card, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/Loader';
import FormContainer from '../components/FormContainer';

import { useLoginMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { toast } from 'react-toastify';

const TEST_CREDENTIALS = [
  {
    role: 'Admin',
    name: 'Admin User',
    email: 'admin@shopkaro.com',
    password: 'admin123456',
    variant: 'danger',
    description: 'Full admin access (Products, Orders, Users)',
  },
  {
    role: 'Customer',
    name: 'Jane Doe',
    email: 'customer@shopkaro.com',
    password: 'customer123456',
    variant: 'primary',
    description: 'Onboarded client with pre-filled address',
  },
  {
    role: 'New User',
    name: 'Alex Smith',
    email: 'newuser@shopkaro.com',
    password: 'newuser123456',
    variant: 'warning',
    description: 'Pending onboarding (Tests wizard flow)',
  },
  {
    role: 'Demo User',
    name: 'Test Shopper',
    email: 'testuser@shopkaro.com',
    password: 'test1234',
    variant: 'success',
    description: 'Standard client with order history',
  },
];

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [login, { isLoading }] = useLoginMutation();

  const { userInfo } = useSelector((state) => state.auth);

  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const redirect = sp.get('redirect') || '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, redirect, userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      const res = await login({ email: cleanEmail, password: cleanPassword }).unwrap();
      dispatch(setCredentials({ ...res }));
      navigate(redirect);
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Authentication failed');
    }
  };

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    toast.info(`Filled credentials for ${acc.name} (${acc.role})`);
  };

  return (
    <FormContainer>
      <div className='d-flex align-items-center justify-content-between mb-3'>
        <h1 className='mb-0'>Sign In</h1>
        <Badge bg='dark' className='p-2'>Supabase Auth</Badge>
      </div>

      <Form onSubmit={submitHandler}>
        <Form.Group className='my-2' controlId='email'>
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type='email'
            placeholder='Enter email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          ></Form.Control>
        </Form.Group>

        <Form.Group className='my-2' controlId='password'>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Enter password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          ></Form.Control>
        </Form.Group>

        <Button disabled={isLoading} type='submit' variant='primary' className='w-100 mt-2 py-2'>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {isLoading && <Loader />}
      </Form>

      {/* Quick-Fill Test Credentials Card */}
      <Card className='my-4 shadow-sm border-0' style={{ background: '#f8fafc', borderRadius: '12px' }}>
        <Card.Body className='p-3'>
          <div className='d-flex align-items-center justify-content-between mb-2'>
            <h6 className='fw-bold mb-0 text-dark'>
              <i className='fas fa-key me-2 text-primary'></i>
              Quick-Fill Test Credentials
            </h6>
            <small className='text-muted'>Click to auto-fill</small>
          </div>
          <p className='text-muted small mb-3'>
            Select any test account below to auto-fill credentials for that role:
          </p>

          <Row className='g-2'>
            {TEST_CREDENTIALS.map((acc) => (
              <Col xs={12} sm={6} key={acc.email}>
                <Button
                  variant='outline-secondary'
                  size='sm'
                  className='w-100 text-start p-2 bg-white border d-flex flex-column justify-content-between h-100'
                  style={{ borderRadius: '8px' }}
                  onClick={() => handleQuickFill(acc)}
                >
                  <div className='d-flex justify-content-between align-items-center w-100 mb-1'>
                    <span className='fw-bold text-dark' style={{ fontSize: '0.85rem' }}>{acc.name}</span>
                    <Badge bg={acc.variant} style={{ fontSize: '0.65rem' }}>{acc.role}</Badge>
                  </div>
                  <div className='text-muted' style={{ fontSize: '0.75rem' }}>{acc.email}</div>
                  <div className='text-primary fw-semibold' style={{ fontSize: '0.72rem' }}>Pass: {acc.password}</div>
                </Button>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <Row className='py-2'>
        <Col className='text-center text-muted'>
          New Customer?{' '}
          <Link to={redirect ? `/register?redirect=${redirect}` : '/register'} className='fw-bold text-primary'>
            Register here
          </Link>
        </Col>
      </Row>
    </FormContainer>
  );
};

export default LoginScreen;
