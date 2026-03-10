import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  hideLoader,
  hideMessage,
  hideModal,
  logOut,
  login,
  showLoader,
} from "../actions";
import {
  GENERATE_CAPTCHA,
  LOGIN_END_POINT,
  LOGOUT_END_POINT,
  myAxios,
  myAxiosLogin,
} from "../utils/utils";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ErrorMessage, Field, FormikProvider, useFormik } from "formik";
import * as Yup from "yup";
import { generateCaptcha } from "./CommonFunctions";
import Overlay from "../components/siteLayout/Overlay";

const LoginCommon = ({
  username,
  setCount,
  initcaptchaImage,
  initcaptchaId,
  setCaptchaImage,
  setCaptchaId,
}) => {
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const state = useSelector((state) => state.LoginReducer);
  const { roleName, token, uuid } = state;
  const logout = async () => {
    try {
      dispatch(logOut());
      dispatch(hideLoader());
      dispatch(hideMessage());
      const channel = new BroadcastChannel("logoutChannel");
      channel.postMessage("logout");
      channel.close();

      if (uuid && uuid !== null && roleName && roleName !== null) {
        const formData = new FormData();
        formData.append("uuid", uuid);
        formData.append("roleName", roleName);

        const response = await myAxios.get(
          `${LOGOUT_END_POINT}?uuid=${uuid}&roleName=${roleName}&type=HOMEPAGE`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Error during expiration:", error);
      navigate("/login");
    }
  };
  useEffect(() => {
    const logoutCall = async () => {
      await logout();
    };
    logoutCall();
  }, []);

  const getLogin = async (values) => {
    dispatch(showLoader("Loading,Please Wait...."));

    try {
      const response = await myAxiosLogin.post(LOGIN_END_POINT, values);

      if (response.status === 200) {
        const payload = {
          isLoggedIn: true,
          isDefaultPassword: response.data.isDefaultPassword,
          isProfileUpdated: response.data.isProfileUpdated,
          officerName: response.data.officerName,
          mobile: response.data.mobile,
          parents: response.data.parents,
          services: response.data.services,
          roleId: response.data.roleId,
          userId: response.data.userId,
          username: response.data.username,
          token: response.data.token,
          roleName: response.data.roleName,
          photoPath: response.data.photoPath,
          lastLoginTime: response.data.lastLoginTime,
          uuid: response.data.uuid,
          lastLogoutTime: response.data.lastLogoutTime,
          lastFailureAttemptTime: response.data.lastFailureAttemptTime,
          passwordSinceUpdated: response.data.passwordSinceUpdated,
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          loginLocation: response.data.location,
        };

        dispatch(login(payload));
        dispatch(hideLoader());
        dispatch(hideMessage());
        dispatch(hideModal());
        navigate("/HOME");

        const currentTime = new Date().getHours();
        let welcomeMsg = "";

        if (currentTime >= 5 && currentTime < 12) {
          welcomeMsg =
            "Good morning! A book is a window to the world—start your day with knowledge!";
        } else if (currentTime >= 12 && currentTime < 18) {
          welcomeMsg =
            "Good afternoon! Dive into a book and let your imagination take you on an adventure!";
        } else {
          welcomeMsg =
            "Good evening! End your day with the wisdom of a good book!";
        }

        toast.success(`${welcomeMsg}`, { position: "top-right" });

        if (
          parseInt(response.data.passwordSinceUpdated) >= 85 &&
          parseInt(response.data.passwordSinceUpdated) < 90
        ) {
          toast.warning(
            "Your password will expire in " +
            (90 - response.data.passwordSinceUpdated) +
            " days. Please update it soon."
          );
        }
      } else {
        toast.error("Please enter valid credentials");
      }
    } catch (error) {
      if (error.response) {
        setCaptchaImage(error.response.data.captcha);
        setCaptchaId(error.response.data.captchaId);
        toast.error(`${error.response.data.message}`);
      } else {
        toast.error(`${error}(${error.message})`);
      }
      console.error("Error during authentication:", error);
      dispatch(hideLoader());
    }
    dispatch(hideLoader());
  };

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const validationSchema = Yup.object({
    username: Yup.string()
      .required("Username is required")
      .min(4, "Username must be at least 4 characters")
      .max(18, "Username must be less than 18 characters"),
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
    deptCaptcha: Yup.string()
      .required("Captcha is required")
      .length(6, "Captcha must be exactly 6 characters"),
  });
  const formik = useFormik({
    initialValues: {
      username: username !== "" ? username : "",
      password: "",
      deptCaptcha: "",
      storedCaptchaId: initcaptchaId,
      latitude: null,
      longitude: null,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      values.storedCaptchaId = initcaptchaId;
      values.password = btoa(values.password);
      getLogin(values);
    },
  });

  return (
    <>
      <Overlay />
      <div style={{ alignSelf: "center", padding: "15px" }}>
        <FormikProvider value={formik}>
          <Form autoComplete="off" onChange={formik.handleChange} onSubmit={formik.handleSubmit}>

            <div>
              {username == "" && (
                <div className="form-group mb-1">
                  <label
                    style={{ color: "rgb(1, 28, 77)", fontSize: "18px" }}
                    htmlFor="username"
                  >
                    User Name
                  </label>
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    autoComplete="off"
                    placeholder="USER ID"
                    maxLength={18}
                  />
                  <ErrorMessage
                    name="username"
                    component="div"
                    className="text-danger"
                  />
                </div>
              )}
              <div className="form-group mb-3">
                <label
                  style={{ color: "rgb(1, 28, 77)", fontSize: "18px" }}
                  htmlFor="password"
                >
                  {username === "" ? "Password" : "OTP"}
                </label>
                <div
                  // className="password-field-container"
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #ccc",
                  }}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="form-control"
                    autoComplete="off"
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      backgroundColor: "transparent",
                      color: "#333",
                    }}
                  />
                  <span
                    onClick={togglePasswordVisibility}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        togglePasswordVisibility();
                      }
                    }}

                    style={{
                      color: "rgb(1, 28, 77)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      marginTop: "6px",
                      marginRight: "5px",
                    }}
                  >
                    {showPassword ? (
                      <FaEye size={23} />
                    ) : (
                      <FaEyeSlash size={23} />
                    )}
                  </span>
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-danger"
                />
              </div>

              <div className="form-group mb-3">
                <img
                  src={initcaptchaImage}
                  className="border"
                  height={50}
                  alt="Captcha"
                />
                <i
                  className="fa fa-refresh"
                  aria-hidden="true"
                  title="Refresh Captcha"
                  style={{ fontSize: "22px", cursor: "pointer" }}
                  onClick={() =>
                    generateCaptcha(setCaptchaId, setCaptchaImage, setCount)
                  }
                ></i>
                <Field
                  type="text"
                  name="deptCaptcha"
                  id="deptCaptcha"
                  className="form-control"
                  placeholder="Captcha"
                  maxLength="6"
                />
                <ErrorMessage
                  name="deptCaptcha"
                  component="div"
                  className="text-danger"
                />
              </div>

              <div className="form-group">
                <button
                  type="submit"
                  className="float-right"
                  style={{
                    // background: "linear-gradient(45deg, #0a9e10, #03d068)",
                    backgroundColor: "var(--context-color)",
                    color: "#ffffff",
                    borderRadius: "5px",
                    border: "none",
                    outline: "none",
                    cursor: "pointer",
                    padding: "5px 10px",
                    fontSize: "18px",
                  }}
                >
                  Sign in
                </button>
              </div>
            </div>
          </Form>
        </FormikProvider>
      </div>
    </>
  );
};

export default LoginCommon;
