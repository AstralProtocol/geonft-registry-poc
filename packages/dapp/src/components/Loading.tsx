import { Box, Typography, CircularProgress } from "@mui/material";

export const Loading = ({ children }: Props): JSX.Element => (
  <Box
    width="100%"
    height="100%"
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
  >
    <Typography variant="h5" color="white">
      {children}
    </Typography>
    <Box mt={2} color="white">
      <CircularProgress color="inherit" />
    </Box>
  </Box>
);

interface Props {
  children: string;
}
