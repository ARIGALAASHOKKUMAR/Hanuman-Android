import { NEWMANDALS, NEWVILLAGES } from "./utils/utils";

export const NewVillages = async (e, setVillage, dispatch, districtCode) => {
  dispatch(showLoader());
  try {
    if (!e) {
      setVillage([]);
      dispatch(hideLoader());
      return;
    }

    const response = await myAxios.get(
      NEWVILLAGES + "distCode=" + districtCode + "&mandalCode=" + e,
    );
    if (response.data) {
      setVillage(response.data.Villages);
    } else {
      setVillage([]);
    }
  } catch (error) {
    toast.error(error.response.data.message);
  }

  dispatch(hideLoader());
};

export const GetNewMandals = async (e, setMandal, setVillage, dispatch) => {
  dispatch(showLoader());
  try {
    if (!e) {
      setMandal([]);
      setVillage([]);
      dispatch(hideLoader());
      return;
    }
    const response = await myAxios.get(NEWMANDALS + "zoneCode=" + e);
    if (response.data) {
      setMandal(response.data.Regions);
      setVillage([]);
    } else {
      setMandal({});
    }
  } catch (error) {
    toast.error(error.response.data.message);
  }

  dispatch(hideLoader());
};