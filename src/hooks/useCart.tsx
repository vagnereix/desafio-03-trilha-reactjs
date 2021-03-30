import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>();

  useEffect(() => {
    prevCartRef.current = cart;
  })

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
    // cartPreviousValue é o valor antigo do cart (que estava no localStorage)
    if(cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, cartPreviousValue]);

  const addProduct = async (productId: number) => {
    try {
      // TODO

      // cópia de cart (por conta da lei da imutab)
      const updatedCart = [...cart]; 

      // se o produto já existir no carrinho, recebo ele nessa const
      const productExists = updatedCart.find(product => product.id === productId); 

      // carrego o stock desse produto e salvo em stockAmount
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      // se ele já estiver no carrinho, recebo a quantidade atual dele no carrinho e add mais um
      const currentAmount =  productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;
      
      // verif se a quantidade dele no carrinho é maior que o stock dele
      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExists){
        // se já existe no carrinho só altero a quantidade
        productExists.amount = amount;
      } else {
        // se não pego o produto com o id recebido
        const product = await api.get(`/products/${productId}`);

        // guardo todos os dados do produto e add a quantidade dele no carrinho (amount)
        const newProduct = {
          ...product.data,
          amount: 1
        }

        // add novo produto no carrinho (cópia de cart)
        updatedCart.push(newProduct);
      }

      // substitui o valor de cart pelo carrinho atualizado (updatedCart)
      setCart(updatedCart);

      // guarda no localStorage
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const updatedCart = [...cart];

      // Returns the index of the first element in the array where predicate is true, and -1 otherwise.
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      if(productIndex >= 0){
        // Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
      } else {
        throw Error();
      }

    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if(amount <= 0) return;
      
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      
      // verif se a quantidade dele no carrinho é maior que o stock dele
      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExists){
        // se já existe no carrinho só altero a quantidade
        productExists.amount = amount;
        setCart(updatedCart);
      } else {
        throw Error();
      }
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
