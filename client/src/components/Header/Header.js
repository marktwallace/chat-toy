import React from 'react';

function Header({children,...delegated}) {
  return (
    <header>
      <h1 {...delegated}>{children}</h1>
    </header>
  );
}

export default Header;
