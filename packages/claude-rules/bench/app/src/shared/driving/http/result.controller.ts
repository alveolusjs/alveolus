import type { Result } from '@alveolus/core';
import { HttpException, HttpStatus } from '@nestjs/common';

export abstract class ResultController {
	protected abstract readonly statuses: Readonly<Record<string, number>>;

	protected orHttpError<T>(result: Result<T, { readonly type: string }>): T {
		if (result.ok) {
			return result.value;
		}

		const status = this.statuses[result.error.type] ?? HttpStatus.UNPROCESSABLE_ENTITY;

		throw new HttpException({ type: result.error.type }, status);
	}
}
