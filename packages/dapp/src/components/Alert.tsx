import React from "react";
import { Snackbar } from "@mui/material";
import MuiAlert, { AlertProps as MuiAlertProps } from "@mui/material/Alert";

export const Alert = (props: AlertProps) => {
  const { open, onClose, severity, children } = props;

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
      <AlertWrapper
        onClose={onClose}
        severity={severity}
        sx={{ width: "100%" }}
      >
        {children}
      </AlertWrapper>
    </Snackbar>
  );
};

interface AlertProps {
  open: boolean;
  onClose: () => void;
  severity: "error" | "info" | "success" | "warning";
  children: string;
}

const AlertWrapper = React.forwardRef<HTMLDivElement, MuiAlertProps>(
  function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }
);
