import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import ListingCreationScreen from './ListingCreationScreen';

const useAveragePrice = (searchQuery) => {
  const [averagePrice, setAveragePrice] = useState(null);

  useEffect(() => {
    if (!searchQuery) {
      setAveragePrice(null);
      return;
    }

    const fetchAveragePrice = async () => {
      try {
        const response = await fetch(
                  `https://search.wb.ru/exactmatch/ru/common/v4/search?curr=rub&lang=ru&locale=ru&query=${encodeURIComponent(searchQuery)}&resultset=catalog&page=0`);

        if (!response.ok) throw new Error(`${response.status}`);

        const data = await response.json();
        const products = data['data']['products'] || [];
        console.log(products)
        if (products.length > 0) {
          const prices = products.slice(0, 10).map((product) => product.salePriceU/100);
          const prods = products.slice(0, 10).map((product) => [product.brand, product.name, product.id, product.supplier]);
          const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
          setAveragePrice(avg);
        } else {
          setAveragePrice(null);
        }
      } catch (error) {
        console.error(error.message);
        setAveragePrice(null);
      }
    };

    fetchAveragePrice();
  }, [searchQuery]);

  return averagePrice;
};

export default useAveragePrice;