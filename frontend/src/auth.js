export const loginUser = (role) => {
  localStorage.setItem("role", role);
};

export const logoutUser = () => {
  localStorage.removeItem("role");
};

export const getUserRole = () => {
  return localStorage.getItem("role");
};
