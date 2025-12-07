import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto implements Partial<CreateUserDto> {
  email?: string;
  name?: string;
  password?: string;
}
