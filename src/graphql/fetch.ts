const doGraphQLFetch = async (url: string, query: string, variables: any) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  if (!response.ok) throw new Error(response.statusText);
  const json = await response.json();
  return json.data;
};

export { doGraphQLFetch };
