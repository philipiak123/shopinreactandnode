// Koszyk.js

import React from 'react';

const Koszyk = ({ cart }) => {
  return (
    <div>
      <h2>Zawartość koszyka</h2>
      <pre>{JSON.stringify(cart, null, 2)}</pre>
    </div>
  );
};

export default Koszyk;
