import { useSelector } from 'react-redux';

export const useAdministrator = () =>
  useSelector((state) => {
    return state.session?.user?.administrator ?? false;
  });

export const useManager = () =>
  useSelector((state) => {
    const admin = state.session?.user?.administrator ?? false;
    const manager = (state.session?.user?.userLimit || 0) !== 0;
    return admin || manager;
  });

export const useDeviceReadonly = () =>
  useSelector((state) => {
    const admin = state.session?.user?.administrator ?? false;

    const serverReadonly = state.session?.server?.readonly ?? false;
    const userReadonly = state.session?.user?.readonly ?? false;

    const serverDeviceReadonly = state.session?.server?.deviceReadonly ?? false;
    const userDeviceReadonly = state.session?.user?.deviceReadonly ?? false;

    return !admin && (serverReadonly || userReadonly || serverDeviceReadonly || userDeviceReadonly);
  });

export const useRestriction = (key) =>
  useSelector((state) => {
    const admin = state.session?.user?.administrator ?? false;

    const serverValue = state.session?.server?.[key] ?? false;
    const userValue = state.session?.user?.[key] ?? false;

    return !admin && (serverValue || userValue);
  });