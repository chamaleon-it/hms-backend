import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
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
import { sanitizeUser } from 'src/auth/sanitize-user';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * H2: replace legacy non-sparse unique `username_1` with a partial unique
   * index so multiple users may omit username / store null without E11000.
   */
  async onModuleInit() {
    try {
      const collection = this.userModel.collection;
      const indexes = await collection.indexes();
      const usernameIdx = indexes.find((idx) => idx.name === 'username_1');
      const isPartialUnique =
        !!usernameIdx?.unique &&
        !!usernameIdx?.partialFilterExpression &&
        JSON.stringify(usernameIdx.partialFilterExpression) ===
          JSON.stringify({ username: { $type: 'string', $gt: '' } });

      if (usernameIdx && !isPartialUnique) {
        await collection.dropIndex('username_1');
        this.logger.log(
          'Dropped legacy non-partial username_1 index (allows multiple null usernames)',
        );
      }

      if (!isPartialUnique) {
        await collection.createIndex(
          { username: 1 },
          {
            unique: true,
            name: 'username_1',
            partialFilterExpression: {
              username: { $type: 'string', $gt: '' },
            },
          },
        );
        this.logger.log(
          'Ensured partial unique username_1 index (unique when set)',
        );
      }
    } catch (err: any) {
      // Index ops can fail briefly during deploy; do not crash boot.
      this.logger.warn(
        `Username index migration skipped/failed: ${err?.message || err}`,
      );
    }
  }

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
    return sanitizeUser(user);
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

    return user?.pharmacy?.billing?.prefix ?? 'INV';
  }

  async getPharmacyInventoryAllowNegativeStock(
    id?: mongoose.Types.ObjectId,
  ): Promise<boolean> {
    if (!id) return false;
    const user = await this.userModel
      .findById(id)
      .select('pharmacy.inventory.allowNegativeStock')
      .lean()
      .exec();

    return user?.pharmacy?.inventory?.allowNegativeStock ?? false;
  }

  async getPharmacyBilling(id: string): Promise<User['pharmacy']['billing']> {
    const user = await this.userModel
      .findById(id)
      .select('pharmacy.billing')
      .lean();
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user.pharmacy.billing;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({
      email: forgotPasswordDto.email,
    });
    // Opaque response — do not reveal whether the email exists or return the token.
    if (!user) {
      return { sent: true };
    }
    await this.jwtService.signAsync(
      { id: user._id },
      {
        secret: configuration().secret.forgotPassword,
        expiresIn: '7d',
      },
    );
    // Token is generated for future email delivery; never log or return it.
    return { sent: true };
  }

  async getAllDoctors() {
    const data = await this.userModel
      .find({ role: UserRole.DOCTOR })
      .select(
        'name email phoneNumber address profilePic specialization qualification designation',
      )
      .sort({ name: 1 })
      .lean();
    return data;
  }

  async updateUser(id: mongoose.Types.ObjectId, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
      runValidators: true,
    });

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

  async getUserById(id: any) {
    if (!mongoose.isValidObjectId(id)) return null;
    return this.userModel.findById(id).lean().exec();
  }
}
