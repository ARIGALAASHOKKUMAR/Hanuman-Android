import React from "react";
import Tooltip from "@mui/material/Tooltip";
import Zoom from "@mui/material/Zoom";
const CustomTooltip = ({ direction, color, title, content }) => { return <Tooltip title={title} arrow TransitionComponent={Zoom} placement={direction} sx={{ "& .MuiTooltip-tooltip": { backgroundColor: "white !important", color: "black", fontSize: 14, borderRadius: 4, padding: 0, margin: 0 }, "& .MuiTooltip-arrow": { color: "white !important" } }}><span style={{ fontSize: "19px", cursor: "pointer", color: color }}>{content}</span></Tooltip>; };
export default CustomTooltip;
