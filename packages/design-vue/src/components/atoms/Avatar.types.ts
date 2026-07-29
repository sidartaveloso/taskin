export type AvatarType = {
  models: AvatarModels;
  props: AvatarProps;
  emits: AvatarEmits;
};

export type AvatarModels = {};

export type AvatarProps = {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

export type AvatarEmits = {};
