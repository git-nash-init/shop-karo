import { useState, useEffect } from 'react';
import { Form, Button, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import FormContainer from '../components/FormContainer';
import CheckoutSteps from '../components/CheckoutSteps';
import { savePaymentMethod } from '../slices/cartSlice';

const PaymentScreen = () => {
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart);
  const { shippingAddress } = cart;

  useEffect(() => {
    if (!shippingAddress.address) {
      navigate('/shipping');
    }
  }, [navigate, shippingAddress]);

  const [paymentMethod, setPaymentMethod] = useState(
    cart.paymentMethod || 'Instant Checkout'
  );

  const dispatch = useDispatch();

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    navigate('/placeorder');
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 step3 />
      <h1>Payment Method</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group className='mb-3'>
          <Form.Label as='legend'>Select Payment Method</Form.Label>
          <Col>
            <Form.Check
              className='my-3'
              type='radio'
              label='⚡ Instant Mock Payment (Card / UPI / NetBanking Simulation)'
              id='Instant'
              name='paymentMethod'
              value='Instant Checkout'
              checked={paymentMethod === 'Instant Checkout'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <Form.Check
              className='my-3'
              type='radio'
              label='💵 Cash on Delivery (COD)'
              id='COD'
              name='paymentMethod'
              value='Cash on Delivery'
              checked={paymentMethod === 'Cash on Delivery'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </Col>
        </Form.Group>

        <Button type='submit' variant='primary'>
          Continue
        </Button>
      </Form>
    </FormContainer>
  );
};

export default PaymentScreen;
