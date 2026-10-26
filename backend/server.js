import app from './app.js';

const port = process.env.PORT || 5001;

app.listen(port, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`)
);
