import { Link, useParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Button, Badge } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaLock, FaCreditCard } from 'react-icons/fa';
import Message from '../components/Message';
import Loader from '../components/Loader';
import {
  useDeliverOrderMutation,
  useGetOrderDetailsQuery,
  usePayOrderMutation,
} from '../slices/ordersApiSlice';

const OrderScreen = () => {
  const { id: orderId } = useParams();

  const {
    data: order,
    refetch,
    isLoading,
    error,
  } = useGetOrderDetailsQuery(orderId);

  const [payOrder, { isLoading: loadingPay }] = usePayOrderMutation();

  const [deliverOrder, { isLoading: loadingDeliver }] =
    useDeliverOrderMutation();

  const { userInfo } = useSelector((state) => state.auth);

  // Instant Mock / Fake Payment Handler
  const fakePayHandler = async () => {
    try {
      const mockDetails = {
        id: `MOCK_TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        status: 'COMPLETED',
        update_time: new Date().toISOString(),
        payer: {
          email_address: userInfo?.email || order?.user?.email || 'customer@shopkaro.com',
        },
      };

      await payOrder({ orderId, details: mockDetails }).unwrap();
      refetch();
      toast.success('🎉 Payment simulated successfully! Order marked as PAID.');
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Payment failed');
    }
  };

  const deliverHandler = async () => {
    try {
      await deliverOrder(orderId).unwrap();
      refetch();
      toast.success('Order marked as delivered');
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Delivery update failed');
    }
  };

  return isLoading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error?.data?.message || error.error}</Message>
  ) : (
    <>
      <div className='d-flex align-items-center justify-content-between mb-3'>
        <h1 className='h3 mb-0'>Order #{order._id.substring(0, 8)}...</h1>
        {order.isPaid ? (
          <Badge bg='success' className='p-2 fs-6'>
            <FaCheckCircle className='me-1' /> Paid
          </Badge>
        ) : (
          <Badge bg='warning' text='dark' className='p-2 fs-6'>
            Payment Pending
          </Badge>
        )}
      </div>

      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Name: </strong> {order.user?.name}
              </p>
              <p>
                <strong>Email: </strong>{' '}
                <a href={`mailto:${order.user?.email}`}>{order.user?.email}</a>
              </p>
              <p>
                <strong>Address: </strong>
                {order.shippingAddress?.address}, {order.shippingAddress?.city}{' '}
                {order.shippingAddress?.postalCode},{' '}
                {order.shippingAddress?.country}
              </p>
              {order.isDelivered ? (
                <Message variant='success'>
                  Delivered on {order.deliveredAt ? order.deliveredAt.substring(0, 10) : 'Done'}
                </Message>
              ) : (
                <Message variant='danger'>Not Delivered</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Payment Method</h2>
              <p>
                <strong>Method: </strong>
                {order.paymentMethod || 'Instant Checkout'}
              </p>
              {order.isPaid ? (
                <Message variant='success'>
                  Paid on {order.paidAt ? order.paidAt.substring(0, 10) : 'Done'}{' '}
                  {order.paymentResult?.id && (
                    <span className='small text-muted d-block'>
                      Transaction ID: {order.paymentResult.id}
                    </span>
                  )}
                </Message>
              ) : (
                <Message variant='danger'>Not Paid</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Order Items</h2>
              {order.orderItems.length === 0 ? (
                <Message>Order is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {order.orderItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row className='align-items-center'>
                        <Col md={1} xs={3}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>
                            {item.name}
                          </Link>
                        </Col>
                        <Col md={4} xs={5} className='text-end'>
                          {item.qty} x ${item.price} = <strong>${(item.qty * item.price).toFixed(2)}</strong>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card className='shadow-sm border-0'>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col className='text-end'>${order.itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col className='text-end'>${order.shippingPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col className='text-end'>${order.taxPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col><strong>Total</strong></Col>
                  <Col className='text-end'>
                    <strong className='text-primary fs-5'>${order.totalPrice}</strong>
                  </Col>
                </Row>
              </ListGroup.Item>

              {/* Instant Fake Checkout Section */}
              {!order.isPaid && (
                <ListGroup.Item className='bg-light p-3'>
                  <div className='d-flex align-items-center mb-2 text-success'>
                    <FaLock className='me-2' />
                    <span className='small fw-bold'>Simulated Test Checkout</span>
                  </div>
                  <p className='text-muted small mb-3'>
                    No real credit card or PayPal required. Click below to simulate instant payment verification.
                  </p>

                  {loadingPay ? (
                    <Loader />
                  ) : (
                    <Button
                      type='button'
                      variant='success'
                      size='lg'
                      className='w-100 fw-bold'
                      onClick={fakePayHandler}
                    >
                      <FaCreditCard className='me-2' /> Pay ${order.totalPrice}
                    </Button>
                  )}
                </ListGroup.Item>
              )}

              {loadingDeliver && <Loader />}

              {userInfo &&
                userInfo.isAdmin &&
                order.isPaid &&
                !order.isDelivered && (
                  <ListGroup.Item>
                    <Button
                      type='button'
                      className='btn btn-primary w-100'
                      onClick={deliverHandler}
                    >
                      Mark As Delivered
                    </Button>
                  </ListGroup.Item>
                )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderScreen;
