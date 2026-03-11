import axios from "axios";
import { Alert } from "react-native";
import { store } from "../reducers/allReducers";
import { useDispatch } from "react-redux";
import { hideMessage, showLoader } from "../actions";

export const base_url = "https://swapi.dev.nidhi.apcfss.in/apsawmills";

const state = store.getState();
const accessToken = state.LoginReducer.token;

export const myAxios = axios.create({
  baseURL: base_url,
  headers: {
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  },
});

export const myAxiosLogin = axios.create({
  baseURL: base_url,
  headers: {},
});

// myAxios.interceptors.request.use(
//   (config) => {
//     const state = store.getState();
//     const accessToken = state.LoginReducer.token;

//     console.log("accessToken",accessToken);

//     if (accessToken) {
//       config.headers["Authorization"] = `Bearer ${accessToken}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   },
// );

const getCurrentTimestamp = () => {
  const now = new Date();
  const istTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const date = istTime.toLocaleDateString("en-GB");
  const time = istTime.toLocaleTimeString("en-US", { hour12: true });
  return `${date} ${time}`;
};

export const commonAPICall = async (url, values, get_post) => {
  let msg = null;
  let msgType = null;
  let responseStatus = null;
  let response = null;
  let data = null;
  const dispatch = useDispatch();
  console.log("testtt");
  
  // dispatch(hideMessage());
  dispatch(showLoader("Loading, Please Wait....."));
  try {
    if (
      get_post !== undefined &&
      get_post !== "undefined" &&
      get_post !== null &&
      get_post !== "null" &&
      get_post.toUpperCase() === "POST"
    ) {
      response = await myAxios.post(url, values);
    } else {
      response = await myAxios.get(url, values);
    }

    responseStatus = response.status ?? "unknown status";
    msg =
      response.data.message !== undefined && response.data.message !== null
        ? response.data.message
        : "Operation completed successfully.";
    msgType = "success";
    data = response.data != null ? response.data : null;
  } catch (error) {
    msgType = "failure";

    if (error.response) {
      msg =
        error.response.data?.message === ""
          ? ""
          : error.response.data?.message
            ? `${error.response.data.message} (${error.response.data.status})`
            : "An error occurred";
      responseStatus = error.response.status;
    } else {
      msg = `An unexpected error occurred: ${error.message}`;
      responseStatus = 9999;
    }
  }

  if (msg.trim() !== "") {
    dispatch(showMessage(msg + " [" + getCurrentTimestamp() + "]", msgType));
    // Toast(msg, msgType);
  }
  dispatch(hideLoader());
  return { data: data, status: responseStatus };
};

const showNativeMessage = (msg, type) => {
  if (type?.toUpperCase() === "SUCCESS") {
    Alert.alert("Success", msg);
    return;
  } else if (type?.toUpperCase() === "FAILURE") {
    Alert.alert("Error", msg);
    return;
  } else {
    Alert.alert("Info", msg);
    return;
  }
};

export const CONTEXT_NAME = "H.A.N.U.M.A.N.";
export const CONTEXT_HEADING = "H.A.N.U.M.A.N.";
export const BASE_SERVER_URL = "https://forests.ap.gov.in/uploads/";
export const ACC_YEAR = new Date().getFullYear().toString();
export const LOGIN_END_POINT = "/api/open/login";
export const GENERATE_CAPTCHA = "/api/open/generate-captcha";
export const SERVICE_AUTH_END_POINT = "/api/user/validateToken";
export const LOGOUT_END_POINT = "/api/user/logout";
export const LOGOUT_ALL_END_POINT = "/api/user/logoutall";
export const LOGOUT_ALL_EXCEPT_THIS_END_POINT =
  "/api/user/logoutexceptcurrentsession";
export const USER_CREATION_END_POINT = "/api/user/UserCreation";
export const USER_CREATION_ROLES = "/api/user/getRoles";
export const USER_CREATION_USERS_LIST = "/api/user/getUsersList";
export const SERVICES_MASTER_END_POINT = "/api/services/ServicesMaster";
export const SERVICES_CREATION_SERVICES = "/api/services/getServices";
export const SERVICES_MASTER_SERVICES_LIST = "/api/services/getServicesList";
export const ROLE_SERVICE_MAPPING = "/api/role/RoleServiceMapping";
export const ROLE_SERVICE_MAPPING_ADD_SERVICE =
  "/api/role/AddRoleServiceMapping";
export const ROLE_SERVICE_ADD_NEW_ROLE = "/api/role/addNewRole";
export const CHANGE_PASSWORD = "/api/auth/changepassword";
export const UpdateProfile = "/api/auth/UpdateProfile";
export const SUBMIT_FEEDBACK = "/api/open/submitfeedback";
export const SUBMIT_FEEDBACKTOKEN = "/api/user/submitfeedback";
export const GET_FEEDBACK_REPORT = "/api/user/getfeedbackreport";
export const GET_FEEDBACK_REPORT_DRILLDOWN =
  "/api/user/getfeedbackreportdrilldown";
export const UPLOAD_FILE = "/api/user/UploadFile";
export const SAWMILL_REG = "/api/user/SawmillReg";
export const SAWMILL_REG_REPORT = "/api/user/SawmillRegReport";
export const SAWMILL_REG_COMPLETION = "/api/user/SawmillRegCompletion";
export const CFODIVISIONS = "/api/user/CFODivisions";
export const registrationdata = "/registrationdata";
export const planscheme = "/planscheme";
export const adminWing = "/DfoCfoMain";
export const getDivisions = "/DfoMaster/cfo_gntr";
export const WILD_LIFE = "/api/v1/WildllifeWingTable12";
export const WILD_LIFE2 = "api/v1/WildllifeWingTable12?month_year=";
export const SERVICES_MYSCREEN = "/posttotalblocks";
export const SERVICES_O_AND_M = "/model";
export const SERVICES_O_AND_M_GET = "/getmodel/";
export const SERVICES_MYSCREEN_GET = "/getblocks";
export const CAMPA_WING_POST = "/post-campawingdata";
export const CAMPA_WING_SELECT_GET = "/get-campawingdata";
export const SFDA_WING_POST = "/sfda-wing";
export const SFDA_WING_SELECT_GET = "/get-sfdadata/";
export const ADMIN_WING_GET = "/getdfocfo";
export const A_DC_WING_POST = "/registrationdata?type=";
export const A_DC_WING_GET = "/month_year";
export const PRODUCTION_WING_GET = "/getplanscheme/";
export const PRODUCTION_WING_POST = "/getplanscheme";
export const WILDLIFE_WING_POST = "/scheme-details";
export const WILDLIFE_WING_GET = "/wildlife-details?month_year=";
export const ANNUAL_ESTIMATION_WING_GET = "/api/v1/table13?month_year=";
export const ANNUAL_ESTIMATION_WING_POST = "/api/v1/table13";
export const WILD_LIFE2_WING_POST = "/posttotalblocks";
export const WILD_LIFE2_WING_GET = "/getblocks/";
export const HOA_LIST_GET = "/hoas";
export const CAMPAWING = "/campawingdetails?month_year=";
export const DCWING = "/month_year/";
export const SCHEME_GET = "/schemes";
export const SCHEME_COMPONENTS = "/scheme_components";
export const FIRE_POINT = "/api/user/data_forest_firepoint";
export const FIRE_TRUTHING = "api/user/";
export const FIREID_GET = "api/user/getfiredataid";
export const FIREID_DATA_DETAILS = "api/user/";
export const SAWMILL_REG_POST = "/api/user/receipts_forest_produce";
export const SAWMILL_REG_POST_DISPOSAL = "/api/user/disposal_forest_produce";
export const FOREST_REPORT_POST = "/api/user/getfiredatadetailreport?";
export const FIRE_DATEWISE_REPORT = "api/user/getcirclewisereport";
export const FIRE_DATA_DIVISIONWISE_REPORT = "api/user/getdivisionwisereport";
export const FIRE_DATA_RANGE_WISE_REPORT = "api/user/getrangewisereport";
export const FIRE_DATA_POINT_WISE_REPORT = "api/user/getfiredatapointsreport";
export const PROFORMAS_REPORT = "api/user/getcfodetailreport?";
export const PROFORMAS_CMID_REPORT = "api/user/getcfowisedetailreport?";
export const RANGE_WISE_REPORT = "api/user/getforestfirerangewisereport";
export const MANDALS = "api/user/getmandals?";
export const VILLAGES = "api/user/getvillages?";
export const SAWMILL_REG_GET = "api/user/sawmillreg";
export const MACHINERY_GET = "api/user/machinery";
export const SAWMILL_GET = "api/user/sawmillregcomple";
export const AdminWingReport = "api/user/adminwingmonthlyproformasreport?";
export const ADCWing_Report = "api/user/adcwingmonthlyproformasreport?";
export const CAMPAWing_Report = "api/user/campawingmonthlyproformasreport?";
export const SFDA_Report = "api/user/sfdawingmonthlyproformasreport?";
export const OM_WING_Report = "api/user/omwingmonthlyproformasreport?";
export const WLR_WING_Report = "api/user/wlrwingmonthlyproformasreport?";
export const WILDLIFE_Report = "api/user/wildlifewingmonthlyproformasreport?";
export const PRODUCTION_Report =
  "api/user/productionwingmonthlyproformasreport?";
export const AllAandDCReport = "api/user/AllAandDCReport?";
export const AllCAMPAReport = "api/user/AllCampaReport?";
export const AllOandMReport = "api/user/AllOandMReport?";
export const AllWLRMReport = "api/user/AllWLRMReport?";
export const AllSFDAReport = "api/user/AllSFDAReport?";
export const AllWildLifeReport = "api/user/AllWILDLIFEReport?";
export const AllProductionReport = "api/user/AllProductionReport?";
export const ZOO_COLLECTION_POST = "api/user/zooanimalcollection";
export const RANGES = "api/user/getrange";
export const SECTIONSDIFF = "api/user/getsection?";
export const SECTIONS = "api/user/getsection?";
export const BLOCK = "api/user/getblock?";
export const UPLOAD_DATA = "api/user/UploadFile?";
export const ZOO_COLLECTION_GET = "api/user/zoodetails?";
export const APPROVED_GET_SAWMILL = "api/user/sawmillregcompletebymobile?";
export const SAWMILL_APPROVE_POST = "api/user/SawmillRegCompletionbymobile";
export const GAZETTE_UPLOAD_DATA = "api/user/uploads";
export const UPLOAD_REPORT = "api/user/getuploadcfowisereport";
export const DFO_UPLOAD_REPORT = "api/user/getuploaddfowisereport?";
export const FRO_UPLOAD_REPORT = "api/user/getuploadfrowisereport?";
export const FORMIIIA_REPORT = "api/user/getFormIIIAReport";
export const FORMIIIB_REPORT = "api/user/getFormIIIBReport";
export const FIRE_ID_SHOW = "api/user/getfireid?";
export const ECOTOURISMPAYMENT = "api/open/paymentinitiate";
export const VEHICLEDETAILS = "api/user/vehicledetails";
export const ECO_TOURISM_CHECKING = "api/open/hotelroomsavailabiltycheck?";
export const SAWMILLSREGREPORT = "api/sawmills-reg-cfo-wise-report";
export const SAWMILLSREGREPORTDFO = "api/sawmills-reg-dfo-wise-report";
export const getUploadsOverallreport = "api/user/getuploaddetailreport?";
export const getSawmillsOverallreport = "api/sawmillsregoveralldetailedreport?";
export const Firedata = "api/user/firedatescount";
export const BOOKING_ID = "api/open/bookingdetails?";
export const loadBookingIDsForCheckIn = "api/user/bookingids?spot_id=";
export const Firedfodata = "";
export const PAYMENT = "api/open/paymentinitiates";
export const ECO_TOURISM = "api/open/paymentsinitiate";
export const VEHICLEDETAILSALLOTED = "api/user/allotedoptions";
export const GET_VEHICLES_REPORT = "api/user/overallvehicledetailsreport";
export const CHECKIN = "api/user/checkindetails?";
export const RoomBookingDetailsReport = "/api/user/getbookingdetailsreport?";
export const MAPSHOWING = "api/user/firedatescount";
export const VEHICLESREPORT = "api/user/vehicledetailsreport";
export const VEHICLESMAKE = "api/user/vehiclename";
export const FireMonthWiseReport =
  "api/user/forestfireincidentsareaburntreport?";
export const Plantationtargets = "api/user/plantationschemedetails";
export const UPLOADREPORT = "api/user/getfileuploadreport";
export const GET_IFS_DETAILS = "api/user/officerprofile";
export const VEHICLES_ABSTRACT = "api/user/insertvehicledetailsabstract";
export const VEHICLES_ABSTRACT_GET = "api/user/vehicledetailsabstract";
export const IFS_DETAILS = "api/user/OfficerProfileDetails";
export const IFS_REPORT = "api/user/OverallOfficerProfileDetails";
export const IFS_REPORT_SPECIFC = "api/user/overallofficerprofile?";
export const VEHICLES_ABSTRACT_REPORT =
  "api/user/vehicledetailsabstractcforeport";
export const VEHICLES_ABSTRACT_DRILL_REPORT =
  "api/user/vehicledetailsabstractdforeport?";
export const DYNAMIC_REPORT = "api/user/QueryExplorer";
export const CANCELLTAION_REQUEST = "api/open/cancellationrequest?";
export const GUEST_LOGIN = "api/open/guestlogin?";
export const GUEST_BOOKING_DETAILS = "api/user/ecotourismguest";
export const ViewGuestDetails = "api/open/viewguestdetails?";
export const NURSERY_STOCK_DETAILS_POST = "api/user/nurserystockdetails";
export const CAMPA_PLANTATION_STATUS_POST = "api/user/campaplantationdetails";
export const NURSERY_STOCK_DETAILS_REPORT =
  "api/user/nurserystockdetailsreport";
export const CAMPA_PLANTATION_REPORT = "api/user/campaplantationdetailsreport";
export const SPECIES = "api/user/nurseryspecies";
export const CAMPADIVISIONS = "api/user/campadivisions";
export const CAMPABEAT = "api/user/campabeat?";
export const CAMPASCHEME = "api/user/campascheme";
export const GAZETTE_UPLOAD_REPORT = "api/user/getgazetteuploadreport";
export const GAZETTE_CFO_UPLOAD_REPORT =
  "api/user/getdetaileduploadcfowisereport?";
export const GAZETTE_DIVISION_UPLOAD_REPORT =
  "api/user/getdetaileduploaddfowisereport?";
export const LOGINATTEMPTS = "api/user/blockedUsers";
export const LOGINRESTART = "api/user/releaseUser?";
export const ADDNURSERYNAME = "api/user/AddNurseryName?";
export const GETNURSERYNAMES = "api/user/getNurseryMasters";
export const ALLDIVISIONS = "api/user/alldivisions";
export const CAMPA_FRO = "api/user/alldetailscampa";
export const ALLNURSERYDETAILS = "api/user/alldetailsnursery";
export const MONTHLYPROGRESSACHIEVEMENT = "api/user/monthlyprogressachievement";
export const MONTHLYGETACHIEVEMENT =
  "api/user/getmonthlyprogressachievementdetails?";
export const getMPreport = "api/user/monthlyprogressachievementreport?";
export const get_fire_points = "api/user/get_fire_points?";
export const FILEUPLOADER = "api/user/excel?";
export const FIREZONATION = "api/user/firezonationdetails";
export const FIREZONATIONREPORT = "api/user/firezonationdetailsreport";
export const YEARLY_PROGRESS_REPORT = "api/user/yearlyprogressreport?";
export const ECOTOURISMSPOTWISEREPORT = "api/user/tourismspotwisedetailsreport";
export const SCREENNAMES = "api/user/getactivitycategories";
export const BOOKING_DETAILS = "api/user/bookingdates";
export const GET_PG_TABLES = "/api/user/getpgtables";
export const SaveForestFireData = "api/open/saveForestFireData";
export const FORESTCOVERPOINTS = "api/user/forestcoveragechange";
export const GETFORESTCOVER = "api/user/forestcoveragechangepoints";
export const FORESTCOVERCHANGEREPORT =
  "api/user/forestcoveragechangepointscount";
export const MonthlyTargetsReport = "api/user/sumofmonthlytargetsreport?";
export const UPDATEROLEAPI = "api/user/updateroleapismapping";
export const YearlyProgressAPO = "api/user/progressofworksreport?";
export const CA_BLOCKS_REPORT = "/api/user/ca_blocks_notified_gazettes?";
export const FCCREPORT = "api/user/forestcoveragechangereport";
export const STATEAPODIVISIONWISEREPORT = "api/user/divisionwiseaporeport?";
export const FIREBULKUPLOADSTATUS = "api/user/firebulkuploadstatus";
export const FIREBULKUPLOADTEMP = "api/user/firebulkuploadtemp?";
export const DASHBOARDSTATISTICS = "api/user/dashboardstatistics";
export const SPOTREVENUEDETAILS = "api/user/spotearnings?";
export const CAPTCHADETAILS = "api/open/getCaptchaDetails";
export const SAWMILLREGISTARTION = "api/user/createChecklistSawmillEntry";
export const CHECKLISTRANGES = "api/user/rangedetailsbydivision";
export const CHECKLISTSIGNDETAILS =
  "api/user/checklist-sawmill-details-signed-pdf";
export const CHECKLISTSIGN = "api/user/saveOrUpdateChecklistSawmillEntry";
export const CHECKLISTCOUNT = "api/user/check-type-transfer-ownership-counts";
export const NEWMANDALS = "api/open/regions?";
export const NEWVILLAGES = "api/open/villages?";
export const VanamahotsavamEntry = "api/user/createVanamahotsavamEntry";
export const VanamahotsavamReg = "api/open/createVanamahotsavamReg";
export const VANAMAHOTSAVGET = "api/user/retrieveRegMahotsav";
export const VANAMAHOTSAVVERIFY = "api/user/vanamohatsavoverallregdata?";
export const VANAMAHOTSAVUPDATE = "api/user/approveVanamahotsavamEntry";
export const VANASECTIONS = "api/user/sections";
export const SCHEMES = "api/user/plantationSchemes";
export const NEWSAWMILLUSERREGISTER =
  "api/open/createregisterUserWoodBasedIndustry";
export const VANAMOHATSAVPLANTATIONENTRYREPORT =
  "api/user/vanamohatsavamPlantationEntryReport";
export const districtWiseAbstractReport = "api/user/districtWiseAbstractReport";
export const plantationEntryDrilldownReport =
  "api/user/plantationEntryDrilldownReport?";
export const getAllVanamahotsavamPlantationImages =
  "api/user/getAllVanamahotsavamPlantationImages?";
export const detailsbyFro = "api/user/detailsbyFro";
// export const SAWMILLCHECKLISTLINCENCE = "api/user/sawmills_checklist_owner"
export const SAWMILLCHECKLISTLINCENCE =
  "api/user/sawmills_checklist_owner_data";
export const SAWMILLCHECKLISTLINCENCEREPORT =
  "api/user/sawmillsChecklistLicencesReport";
export const SAWMILLCHECKLISTAPPROVED = "api/user/sawmillsChecklistLicences";
export const SAWMILLCHECK = "api/user/sawmillsChecklistWithMachinery";
export const SAWMILLCHECKPROVEDSTATUS = "api/user/createSawmillLicenseEntry";
export const OFFENCEENTRY = "/api/user/createOffenceEntry";
export const WOODBASEDINDUSTRY = "api/user/createWoodBasedIndustry";
export const OPENMANDAL = "api/open/getmandals?";
export const APPLICATIONSTATUS = "api/user/getWbiUserDetailsDivision";
export const GETSAWMILLDATA = "api/user/getSawmillChecklistSLCEntryDetails?";
export const GETWOODBASEDDASHBOARD = "api/user/wbiDashboardData";
export const WOODBASEDREPORT = "api/user/woodBasedIndustryStatusReport";
export const SYSTEMSDATA = "api/user/inventorydetails";
export const ADDNEWSYSTEMS = "api/user/createSystemEntry";
export const ITASSETINVENTORY = "api/user/createITAssetInventory";
export const SYSTEMINFOREPORT = "api/user/itAssetInventoryReport";
export const SpotRevenueMonthwise =
  "api/user/spotRevenueMonthwise?checkInDate=2025-01-01&checkOutDate=2025-11-30";
export const UNIONBANKPAYMENTAPI = "/api/open/easebuzz/initiate";
export const FCAMISPOST = "/api/open/fcamispost";
export const RULEFOUR = "api/user/createWbiRule4Entry";
export const FRODETAILS = "api/user/frodetails";
export const PLANTATIONFMISTARGET = "api/user/plantaionfmistarget";
export const PLANTATIONFMISLOCATION = "api/user/plantationlocationdetails";
export const PLANTATIONFMISTECHNICALDETAILS =
  "api/user/plantationtechnicaldetails";
export const PLANTATIONNAMEBYUSERID = "api/user/getplantationdata";
export const PLANTATIONSPECIEDETAILS = "api/user/plantationspeciesdetails";
export const PLANTATIONTARGETDETAILS =
  "api/user/plantationtargetgetapi?financialYear=";
export const SAWMILLRULEFOURDETAILS = "api/user/rule4/industry-applications?";
export const PLANTATIONESTIMATEDETAILS = "api/user/plantaionpmisestimation";
export const PLANTATIONESTIMATEDETAILSGET = "api/user/getEstimationDetails";
export const PLANTATIONSURVIVE = "api/user/plantationSurvival";
export const OVERALLRULEFOURDETAILS = "api/user/getWbiRule4Details?";
export const OVERALLPMISDETAILSGET = "api/user/overAllPmis";
export const VANAMAHOTSAVMANDALSGET =
  "api/user/mandalWiseAbstractReport?districtCode=";
export const VANAMAHOTSAVILLAGESGET = "api/user/villageWiseAbstractReport?";
export const CREATEVOLUNTEER = "api/open/createVolunteer";
export const VOLUNTEERVERIFICATION = "api/user/createVolunteer";
export const CREATESECTIONMASTER = "api/user/createSectionMaster";
export const CREATEBEATMASTER = "api/user/createBeatMaster";
export const SECTIONSGET = "api/user/v1/sections";
export const SECTIONSIDGET = "api/user/v1/sections?sectionId=";
export const BEATSGET = "api/user/v1/beats?sectionId=";
export const CREATEVAJRAACTIVITY = "api/user/createVajraActivity";
export const VANAMAHOTSAVIMAGES = "api/user/haritha/plantation-images/summary?";
export const COUNTS = "api/open/haritha/plantation-summary";
export const VOLUNTEERGET = "api/user/volunteerRegistrations";
export const createIncident = "api/open/createIncident";
export const GETANIMALS = "/api/open/animals";
export const GETINCIDENTS = "api/open/animalIncidentTypes";
export const GETBLOCKS = "api/user/forest-blocks?divisionId=";
export const createBlockGazette = "api/user/createBlockGazette";
export const ANIMALINCIDENTREPORTS =
  "api/open/animal-incident-reports?animalId=";
export const ECOTOURISMFEEDBACK = "api/open/SpotFeedBack";
export const TREKSPOTAPI = "api/open/trekdetails";
export const TREKSPOTSUPDATE = "api/open/trekdetailsupdate";
export const VOLUNTEERMOBILEOTP = "/api/open/incident/send-otp?mobile=";
export const FILE = "api/open/v1/upload";
export const PLANTATIONLOCATIONGETAPI = "api/user/plantationlocationgetapi";
export const OFFENCEGET = "/api/user/vana-suraksha-offence-entry-details";
export const CREATEVISA = "/api/user/createVisa";
export const GETVISAAPPLICATIONS = "/api/user/getVisa";
export const GETHANUMANDASHBOARDDATA =
  "/api/open/animal-incident-reports?animalId=-1";
export const GETDASHBOARDCOUNTS = "/api/open/incident-dashboard";
export const ACCEPTINCIDENT = "/api/open/createIncident";
export const RESOLUTIONTYPES = "/api/user/resolution-types";
export const HANAUMANDYCMDASHBOARD = "/api/open/getHanumanDashboardData";
export const VOLUNTEEROTP = "/api/open/volunteer/send-otp?mobile=";
export const RANGEMANDAL = "api/user/createRangeWiseDistrictMandalMapping";
export const GAZETTECIRCLEDATA = "api/user/gazette/circle-dashboard";
export const GAZETTEDIVISIONDATA = "api/user/gazette/division-dashboard";
export const GAZETTEBLOCKWISEDATA = "api/user/gazette/block-dashboard";
