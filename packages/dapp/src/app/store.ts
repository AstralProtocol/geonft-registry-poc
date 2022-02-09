import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import walletReducer from '../features/wallet/walletSlice';
import nftsReducer from '../features/nfts/nftsSlice';
import docsReducer from '../features/docs/docsSlice';

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    nfts: nftsReducer,
    docs: docsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
