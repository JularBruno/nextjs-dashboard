'use server'; // By adding the 'use server', you mark all the exported functions within the file as Server Actions. 
// You can also write Server Actions directly inside Server Components by adding "use server" inside the action. But for this course, we'll keep them all organized in a separate file. We recommend having a separate file for your actions.
import { z } from 'zod';
import { sql } from '@vercel/postgres'; // this part is wrong in tutorial keep in mind ofr later
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

// const FormSchema = z.object({
//     id: z.string(),
//     customerId: z.string(),
//     amount: z.coerce.number(),
//     status: z.enum(['pending', 'paid']),
//     date: z.string(),
//   });
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
      invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
      .number()
      .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
      invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
    // const { customerId, amount, status } = CreateInvoice.parse({
    //   customerId: formData.get('customerId'), // this can be done better for bigger ones
    //   amount: formData.get('amount'),
    //   status: formData.get('status'),
    // });
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    } // TODO form deletes everyvalue when wrong
    const { customerId, amount, status } = validatedFields.data;

    const amountInCents = amount * 100; // It's usually good practice to store monetary values in cents in your database to eliminate JavaScript floating-point errors and ensure greater accuracy.
    // actually I realized you can change the value after
    const date = new Date().toISOString().split('T')[0]; // TODO maybe this wrong because of hos stored 

    // Test it out:
    // const rawFormData = {
    //     customerId: formData.get('customerId'),
    //     amount: formData.get('amount'),
    //     status: formData.get('status'),
    //   };
    // console.log(rawFormData)
    
    try {
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        console.log(error);
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
};

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    const amountInCents = amount * 100;
    try {
        await sql`
          UPDATE invoices
          SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
          WHERE id = ${id}
        `;
    } catch (error) {
        console.log(error);
        
    }
    // This is because redirect works by throwing an error, which would be caught by the catch block. To avoid this, you can call redirect after try/catch
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

export async function deleteInvoice(id: string) {
    // ERROR to test
    throw new Error('Failed to Delete Invoice');

    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`; // TODO load when deleting
        revalidatePath('/dashboard/invoices');
        
    } catch (error) {
        console.log(error);
    }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }