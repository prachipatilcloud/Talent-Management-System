import User from "../models/User.js";

export const createUser = async (req, res, next) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            password,
            role,
            department
        } = req.body;

        // ✅ Validate phone BEFORE saving
        const normalizedPhone = phone?.replace(/\D/g, '');

        if (!normalizedPhone || !/^[6-9]\d{9}$/.test(normalizedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number. Must be 10 digits and start with 6-9.',
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
            });
        }

        // ✅ Create user with VALID phone
        const user = await User.create({
            firstName,
            lastName,
            email,
            phone: normalizedPhone,
            password,
            role,
            department
        });

        // Response
        const userResponse = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,   // ✅ correct
            role: user.role,
            department: user.department,
            isActive: user.isActive,
            createdAt: user.createdAt
        };

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse,
        });

    } catch (error) {
        next(error);
    }
};
export const getUser = async (req, res, next) => {
    try {

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }
        res.status(200).json({
            success: true,
            data: user,
        });

    } catch (error) {
        next(error);
    }
}

export const getUsers = async (req, res, next) => {
    try {

        const { role, page = 1, limit = 10, search } = req.query;
        const query = {};

        if (role) {
            query.role = role;
        }
        if (search) {
            query.$or = [
                {
                    firstName: {
                        $regex: search,
                        $options: 'i',
                    }
                },
                {
                    lastName: {
                        $regex: search,
                        $options: 'i',
                    }
                },
                {
                    email: {
                        $regex: search,
                        $options: 'i',
                    }
                },
            ];
        }

        const total = await User.countDocuments(query);
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(parseInt(limitNumber));

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            totalPages: Math.ceil(total / limitNumber),
            currentPage: parseInt(page),
            data: users,
        })
    } catch (error) {
        next(error);
    }
}


export const updateUser = async (req, res, next) => {
    try {
        const { firstName, lastName, email, phone, password, role, department, isActive } = req.body;

        // Find user by ID
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check if email is being updated and doesn't already exist in another user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists',
                });
            }
        }

        // ✅ Handle phone update
        if (phone !== undefined) {
            const normalizedPhone = phone.replace(/\D/g, '');

            if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number. Must be 10 digits and start with 6-9.',
                });
            }

            user.phone = normalizedPhone;
        }

        // Update only the fields provided in request body
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (email !== undefined) user.email = email;

        if (password !== undefined) user.password = password;
        if (role !== undefined) user.role = role;
        if (department !== undefined) user.department = department;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                department: user.department,
                isActive: user.isActive,
            },
        });

    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {

    try {
        const user = await User.findById(req.params.id);
        // .populate('createdBy', 'firstName lastName email')
        // .populate('interviewRounds.interviewerId', 'firstName lastName email');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account',
            });
        }
        user.isActive = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User account deactivated successfully',
        })


    } catch (error) {
        next(error);
    }
}