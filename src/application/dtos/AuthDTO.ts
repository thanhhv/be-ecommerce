export interface AuthResponseDTO {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
  };
}

export interface UserProfileDTO {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  role: string;
}

export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  address?: string;
}
