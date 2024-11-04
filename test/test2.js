async function main() {
  const CLIENT_SECRET = 'your-client-secret';

  const headers = {
    Authorization: `Bearer ${CLIENT_SECRET}`,
    "Content-Type": "application/json",
  };

  const body = {"name": "test"};

  const response = await fetch("http://localhost:6784/server", {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  resp = await response.json();
  console.log({ resp });
}

main();
