import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserRole } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { JwtService } from '@nestjs/jwt';
import configuration from 'src/config/configuration';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UpdatePasswordDto } from './dto/updatePassword';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const isUserExist = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (isUserExist) {
      throw new BadRequestException(
        'This email address is already registered with us.',
      );
    }
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userModel.create(createUserDto);
    return user;
  }

  async getProfile(user: JWTUserInterface) {
    const data = await this.userModel.findById(user.id).lean();

    if (!data) {
      throw new BadRequestException('User profile not found.');
    }
    return data;
  }

  async getPharmacyBillingPrefix(id: mongoose.Types.ObjectId): Promise<string> {
    const user = await this.userModel
      .findById(id)
      .select('pharmacy.billing.prefix')
      .lean()
      .exec();

    return user?.pharmacy.billing.prefix ?? 'INV';
  }

  async getPharmacyInventoryAllowNegativeStock(
    id: mongoose.Types.ObjectId,
  ): Promise<boolean> {
    const user = await this.userModel
      .findById(id)
      .select('pharmacy.inventory.allowNegativeStock')
      .lean()
      .exec();

    return user?.pharmacy.inventory.allowNegativeStock ?? false;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({
      email: forgotPasswordDto.email,
    });
    if (!user) {
      throw new BadRequestException('Sorry, User not exist.');
    }
    const token = await this.jwtService.signAsync(
      { id: user._id },
      {
        secret: configuration().secret.forgotPassword,
        expiresIn: '7d',
      },
    );
    console.log(`${forgotPasswordDto.email} is requaest for reset link.`);
    console.log(`https://hms.com/reset-passsword?token=${token}`);
    return token;
  }

  async getAllDoctors() {
    const data = await this.userModel
      .find({ role: UserRole.DOCTOR })
      .select('name email phoneNumber address profilePic')
      .lean();
    return data;
  }

  async getAllPharmacyWholesaler() {
    const data = await this.userModel
      .find({ role: UserRole.PHARMACY_WHOLESALER })
      .select('name email phoneNumber address profilePic')
      .lean();
    return data;
  }

  async updateUser(id: mongoose.Types.ObjectId, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true, runValidators: true }, // ✅ Return updated doc & validate
    );

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async updatePassword(
    id: mongoose.Types.ObjectId,
    updatePasswordDto: UpdatePasswordDto,
  ) {
    const user = await this.userModel.findById(id).select('password');
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const isPasswordMatch = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new BadRequestException(
        'Incorrect current password. Please try again.',
      );
    }
    user.password = await bcrypt.hash(updatePasswordDto.password, 10);
    await user.save();
  }

  async getDoctorAvailability(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Please provide a valid doctor id');
    }
    const user = await this.userModel
      .findById(id)
      .select('availability')
      .lean();
    if (!user) {
      throw new NotFoundException('Doctor not found.');
    }

    if (!user.availability) {
      throw new BadRequestException('Doctor is not available');
    }

    return user.availability;
  }

  async syncConsultationValues(id: mongoose.Types.ObjectId, value: string) {
    const user = await this.userModel.findById(id).select('consultationValues');
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    user.consultationValues = value;
    await user.save();
    return null;
  }

  async getConsultationValues(id: mongoose.Types.ObjectId) {
    const user = await this.userModel
      .findById(id)
      .select('consultationValues')
      .lean();
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user.consultationValues;
  }
}
